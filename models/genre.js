var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GenreInstanceSchema = new Schema ({
    name: {
        type: String,
        required: true,
        maxlength: 100,
        minlength: 3
    }
});

GenreInstanceSchema.virtual('url').get(function () {
    return '/catalog/genre/' + this._id;
});

// Export model
module.exports = mongoose.model('Genre', GenreInstanceSchema)