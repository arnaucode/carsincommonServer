var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;


var travelSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    },
    from: { type: String, required: true },
    to: { type: String, required: true },
    date: { type: Date },
    periodic: { type: Boolean },
    generateddate: { type: Date },
    seats: { type: Number, required: true },
    package: { type: Boolean },
    collectivized: { type: Boolean },
    type: { type: String }, //if is an offering travel or asking for travel
    joins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    }],
    joinPetitions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'commentModel'
    }]
})
module.exports = mongoose.model('travelModel', travelSchema);


//modality can be: offering, asking, package
