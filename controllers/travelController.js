//File: controllers/travelController.js
var mongoose = require('mongoose');
var userModel  = mongoose.model('userModel');
var travelModel  = mongoose.model('travelModel');
var commentModel  = mongoose.model('commentModel');

//GET
exports.getAllTravels = function(req, res) {
	//get travels with futures dates ($gte - greater than and equal than)
	travelModel.find({date: {$gte: new Date()}})
        .limit(Number(req.query.pageSize))
        .skip(Number(req.query.pageSize) * Number(req.query.page))
        .exec(function (err, travels) {
            if (err) return res.send(500, err.message);
            res.status(200).jsonp(travels);
        });
};

exports.getTravelById = function (req, res) {
    travelModel.findOne({_id: req.params.travelid})
        .lean()
        .populate('joins', 'username avatar')
        .populate('comments', 'comment user')
        .exec(function (err, travel) {
            if (err) return res.send(500, err.message);
            if (!travel) {
                res.json({success: false, message: 'travel not found.'});
            } else if (travel) {

                res.status(200).jsonp(travel);
            }
        });
};

exports.addTravel = function(req, res) {
	userModel.findOne({'token': req.headers['x-access-token']})
	.exec(function(err, user){
		if (err) return res.send(500, err.message);
		if (!user) {
			console.log("user not found");
            res.json({success: false, message: 'User not found.'});
        } else if (user) {
			var travel = new travelModel({
				title: req.body.title,
			    description:   req.body.description,
			    user:   user._id,
			    from:   req.body.from,
			    to:   req.body.to,
			    date:   req.body.date,
				periodic: req.body.periodic,
			    generateddate: Date(),
				seats: req.body.seats,
				package: req.body.package,
				collectivized: req.body.collectivized,
				type: req.body.modality
			});

			travel.save(function(err, travel) {
				if(err) return res.send(500, err.message);

				user.travels.push(travel._id);
				user.save(function (err, user) {
                    if (err) return res.send(500, err.message);
					exports.getAllTravels(req, res);
                });
			});//end of travel.save
		}
	});//end of usermodel.find


};

exports.updateTravel = function(req, res) {
	userModel.findOne({'token': req.headers['x-access-token']})
	.exec(function(err, user){
        if (err) return res.send(500, err.message);
        console.log(travel);
        travelModel.findOne({_id: travel._id})
        .lean()
        .populate('travels', 'title from to date')
        .exec(function (err, travel) {
            if (err) return res.send(500, err.message);
            if (!travel) {
                res.json({success: false, message: 'travel not found.'});
            } else if (travel) {

                res.status(200).jsonp(travel);
            }
        });
    });
};

//DELETE
exports.deleteTravel = function(req, res) {
	userModel.findOne({'token': req.headers['x-access-token']})
	.exec(function(err, user){
		if (err) return res.send(500, err.message);
		travelModel.findById(req.params.travelid, function(err, travel) {
			if (err) return res.send(500, err.message);
			if(travel.user.equals(user._id))
			{
				travel.remove(function(err) {
					if(err) return res.send(500, err.message);

					console.log("deleted");
					exports.getAllTravels(req, res);
				});
			}
		});
	});
};

/* join */
exports.addJoinPetition = function(req, res) {
	userModel.findOne({'token': req.headers['x-access-token']})
	.exec(function(err, userJoining){
		if (err) return res.send(500, err.message);
		if (!userJoining) {
            res.json({success: false, message: 'User not found.'});
        } else if (userJoining) {
			travelModel.findOne({
				_id: req.params.travelid,
				user: {'$ne': userJoining._id},
				joins: {'$ne': userJoining._id},
				joinPetitions: {'$ne': userJoining._id}
			})
			.exec(function(err, travel){
				if (err) return res.send(500, err.message);
				if (!travel) {
		            res.json({success: false, message: 'travel not found. You can not join a travel if you have created it, or if you have already joined'});
		        } else if (travel) {
					travel.joinPetitions.push(userJoining._id);
					travel.save(function(err, travel) {
						if(err) return res.send(500, err.message);

						//start saving notification, get user owner of travel
						userModel.findOne({_id: travel.user})
						.exec(function(err, user){
							if (err) return res.send(500, err.message);
							if (!user) {
					            res.json({success: false, message: 'User not found.'});
					        } else if (user) {
							//notification
								var notification = {
									type: "join",
									message: "user "+userJoining.username+" joins your travel "+travel.title,
									date: new Date(),
									icon: 'join.png',
									link: ""
								};
								user.notifications.push(notification);
								user.save(function(err, user) {
									if (err) return res.send(500, err.message);

									console.log("notification saved");
									exports.getTravelById(req, res);
								});
							}
						});//end saving notification
					});
				}//end of else if travel
			});
		}//end of else if user
	});
};

exports.unJoin = function(req, res) {
	userModel.findOne({'token': req.headers['x-access-token']})
	.exec(function(err, user){
		if (!user) {
            res.json({success: false, message: 'User not found.'});
        } else if (user) {
			travelModel.findOne({
				_id: req.params.travelid,
				joinPetitions: user._id
			})
			.exec(function(err, travel){
				if (err) return res.send(500, err.message);
				if (!travel) {
		            res.json({success: false, message: 'can not unjoin this travel'});
		        } else if (travel) {
					for(var i=0; i<travel.joinPetitions.length; i++)
					{
						if(travel.joinPetitions[i].equals(user._id))
						{
							travel.joinPetitions.splice(i, 1);
						}
					}
					travel.save(function(err, travel) {
						if(err) return res.send(500, err.message);
						exports.getTravelById(req, res);
					});
				}
			});
		}

	});
};

exports.getJoinsByTravelId = function(req, res) {
    joinModel.find({
      travelId: req.params.travelId
  }, function(err, joins) {

      if (err) throw err;

      if (!joins) {
        res.json({ success: false, message: 'no joins for travelId' });
    } else if (joins) {
          // return the information including token as JSON
		 res.jsonp(joins);

      }

    });
};

exports.findAllTravelsFromUsername = function(req, res) {
    travelModel.find({
      owner: req.params.username,
			date: {$gte: new Date()}
  }, function(err, travels) {

      if (err) throw err;

      if (!travels) {
        res.json({ success: false, message: 'no travels for user' });
    } else if (travels) {
        console.log(travels);
          // return the information including token as JSON
          res.jsonp(travels);


      }

    });
};






/* comment */
exports.addComment = function(req, res) {
	/*var comment = new commentModel({
		travelId: req.params.travelId,
		commentUserId: req.body.commentUserId,
		commentUsername: req.body.commentUsername,
		comment: req.body.comment,
		commentAvatar: req.body.commentAvatar
	});

	comment.save(function(err, comment) {
		if(err) return res.send(500, err.message);
    res.status(200).jsonp(comment);
	});*/
	userModel.find({
		token: req.headers['x-access-token']
	}, function(err, users){
		var user=users[0];

		travelModel.findById(req.params.travelId, function(err, travel){
			console.log(travel.title);
			var comment = {
				commentUserId: user._id,
				commentUsername: user.username,
				comment: req.body.comment,
				commentAvatar: user.avatar
			};
			travel.comments.push(comment);

			travel.save(function(err, travel) {
				if(err) return res.send(500, err.message);
		    //res.status(200).jsonp(travel);
				travelModel.find({date: {$gte: new Date()}}, function(err, travels) {
				    if(err) res.send(500, err.message);
						res.status(200).jsonp(travels);
				});
			});

			//start saving notification, get user owner of travel
			userModel.find({
		      username: travel.owner
		  }, function(err, userowners) {
				var userowner=userowners[0];
				//notification
				var notification = {
					type: "comment",
					otherusername: user.username,
					description: "user "+user.username+" comments your travel "+travel.title,
					date: new Date(),
					link: ""
				};
				userowner.notifications.push(notification);
				userowner.save(function(err, userowner) {
					console.log("notification saved");
				});
			});//end saving notification

		});
	});//end of userModel.find
};

exports.getCommentsByTravelId = function(req, res) {
    commentModel.find({
      travelId: req.params.travelId
  }, function(err, comments) {

      if (err) throw err;

      if (!comments) {
        res.json({ success: false, message: 'no comments for travelId' });
    } else if (comments) {
          // return the information including token as JSON
		 res.jsonp(comments);

      }

    });
};
