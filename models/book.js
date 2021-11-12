var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BookSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Author',
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    isbn: {
        type: String,
        required: true
    },
    genre: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Genre'
    }]
})

// Virtual for book's URL
BookSchema.virtual('url').get(function () {
    return '/catalog/book/' + this._id;
});

// Export model
module.exports = mongoose.model('Book', BookSchema);