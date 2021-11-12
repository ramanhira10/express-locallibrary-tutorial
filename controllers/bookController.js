var async = require('async');
var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
const {body, validationResult} = require('express-validator');

exports.index = function (req, res) {
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback);
        },
        book_instance_count: function (callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function (callback) {
            BookInstance.countDocuments({status: 'Available'}, callback);
        },
        author_count: function (callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function (callback) {
            Genre.countDocuments({}, callback);
        }
    }, function (err, results) {
        res.render('index.pug', {
            title: 'Local Library Home',
            error: err,
            data: results
        });
    });
    /* res.render('index.pug', {
        title: 'Local Library home',
        data: {
            book_count: 5,
            book_instance_count: 5,
            book_instance_available_count: 5,
            author_count: 5,
            genre_count: 5
        }
    }) */
};

// Display list of all books
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
    .sort({title: 1})
    .populate('author')
    .exec(function (err, list_books) {
        if (err) {
            return next(err);
        }
        // Successful, so render
        res.render('book_list.pug', {
            title: 'Book List',
            book_list: list_books
        });
    });
};

// Display detail page for a specific book
exports.book_detail = function(req, res, next) {
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },

        book_instance: function (callback) {
            BookInstance.find({'book': req.params.id}).exec(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.book==null) {
            var err = new Error ('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail.pug', {
            title: results.book.title,
            book: results.book,
            book_instance: results.book_instance
        });
    });
};

// Display book create form on GET
exports.book_create_get = function (req, res, next) {
    async.parallel({
        authors: function (callback) {
            Author.find(callback);
        },
        genres: function (callback) {
            Genre.find(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }

        res.render('book_form.pug', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres
        });
    });
};

// Display book create on POST
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    body('title', 'Ttile must not be empty').trim().isLength({min: 1}).escape(),
    body('author', 'Author must not be empty').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genre for form

            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                }
            }, function (err, results) {
                if (err) {
                    return next(err);
                }

                // Mark our selected genre as checked.
                for (let i=0;i<results.genre.length;i++) {
                    if (book.genre.indexOf(results.genre[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form.pug', {
                    title: 'Create Book',
                    authors: results.authors,
                    genres: results.genres,
                    errors: errors.array()
                });
            });

            return;
        } else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) {
                    return next(err);
                }

                // Successful - redirect to new book record.
                res.redirect(book.url);
            });
        }
    }
];

// Dislay book delete from on GET
exports.book_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Display book delete on POST
exports.book_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET
exports.book_update_get = function (req, res, next) {
    // Get book, authors and genres for form.
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function (callback) {
            Author.find(callback);
        },
        genres: function (callback) {
            Genre.find(callback)
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.book==null) {
            //No results.
            let err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }

        // Success
        // Mark our selected genre as checked
        for (let all_g_iter = 0;all_g_iter<results.genres.length - 1;all_g_iter++) {
            for (let book_g_iter = 0;book_g_iter<results.book.genre.length-1;book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }

        res.render('book_form.pug', {
            title: 'Update Book',
            authors: results.authors,
            genres: results.genres,
            book: results.book
        });
    });
};

// Display book update on POST
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre==='undefined') {
                req.body.genre=[];
            } else {
                req.body.genre=new Array(req.body.genre);
            }
        }
        next();
    },

    body('title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
    body('author', 'Author must not be empty.').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data an dold id.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined' ? [] : req.body.genre),
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                }
            }, function (err, results) {
                if (err) {
                    return next(err);
                }

                // Mark our selected genres as checked.
                for(let i=0;i<results.genres.length;i++) {
                    if(book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form.pug', {
                    title: 'Update Book',
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array()
                });
                return;
            });
        } else {
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
                if (err) {
                    return next(err);
                }
                //Successful - redirect to book detail page.
                res.redirect(thebook.url);
            });
        }

    }
];