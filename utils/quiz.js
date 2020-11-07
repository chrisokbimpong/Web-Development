var config = require('../config/config'),
    models = require('../models/models'),
    misc = require('../utils/misc');

function findUserQuestionsForToday(user_id, fn) {
    var start_day = new Date();
    start_day.setHours(0, 0, 0, 0);
    models.QuizHistory.count({
        user_id: user_id,
        date: {
            $gte: start_day
        }
    }, function (err, count) {
        if (err) throw err;
        return fn(null, count);
    });
}

function findNextQuestion(index, fn) {
    var start_day = new Date();
    start_day.setHours(0, 0, 0, 0);
    var query = models.Question.find({
        date: {
            $gte: start_day
        }
    });
    query.sort({
        date: 1
    });
    query.lean();
    query.exec(function (err, questions) {
        if (err) throw err;
        if (questions.length == 0) {
            //No quiz today!
            return fn(new Error(config.ERR_QUIZ_NOQUIZTODAY), null, null);
        }
        if (index >= questions.length) {
            //No more questions in the quiz!
            return fn(null, null, null);
        } else {
            return fn(null, questions[index], questions.length);
        }
    });
}

function timeCheck(time_window) {
    return timeCheck[time_window] || (timeCheck[time_window] = function (req, res, next) {
        var now = new Date();
        var start_time = new Date();
        var result = false;
        start_time.setHours(config.QUIZ_START_TIME[0]);
        start_time.setMinutes(config.QUIZ_START_TIME[1]);
        start_time.setSeconds(0);
        var stop_time = new Date();
        stop_time.setHours(config.QUIZ_STOP_TIME[0]);
        stop_time.setMinutes(config.QUIZ_STOP_TIME[1]);
        stop_time.setSeconds(0);
        if (time_window == 'inside') {
            result = (start_time.getTime() < now.getTime()) && (now.getTime() < stop_time.getTime());
        } else {
            result = start_time.getTime() > now.getTime();
        }
        (result) ? next(): res.redirect(config.URL.TIMECLOSED);
    });
}

function saveAnswer(user_id, question_id, answer_choice, response_time, fn) {
    var query = {
        user_id: user_id,
        question_id: question_id
    };
    var answer = {
        date: new Date(),
        choice_id: answer_choice,
        response_time: response_time,
        question: question_id
    };
    models.QuizHistory.findOneAndUpdate(query, answer, {
        upsert: true
    }, function (err, upserted_record) {
        if (err) throw err;
        return fn(null, upserted_record);
    });
}

function saveQuestion(question_id, question_json, fn) {
    if (!question_id) {
        new models.Question(question_json).save(function (err, inserted_record) {
            if (err) return fn(err.message, null);
            return fn(null, inserted_record._id);
        });
    } else {
        models.Question.findByIdAndUpdate(question_id, question_json, {
            upsert: true
        }, function (err, upserted_record) {
            if (err) return fn(err.message, null);
            return fn(null, upserted_record._id);
        });
    }
}

function deleteQuestion(question_id, fn) {
    models.Question.findOne({
        _id: question_id
    }, function (err, matching_doc) {
        if (err) return fn(config.ERR_ADMIN_NOQUESTIONFOUND, null);
        matching_doc.remove();
        return fn(null, matching_doc._id)
    });
}

function getAllQuestions(fn) {
    var start_day = new Date();
    start_day.setHours(0, 0, 0, 0);
    var query = models.Question.find({
        date: {
            $gte: start_day
        }
    });
    query.sort({
        date: 1
    });
    query.lean();
    query.exec(function (err, questions) {
        if (err) throw err;
        return fn(null, questions);
    });
}

function getLastNtoMQuestions(last_n, skip_m, fn) {
    models.Question.count({}, function (err, count) {
        var query = models.Question.find({});
        query.sort({
            date: -1
        });
        last_n = (last_n < 0) ? 0 : last_n;
        skip_m = (skip_m < 0) ? 0 : skip_m;
        query.limit(last_n);
        query.skip(skip_m);
        query.lean();
        query.exec(function (err, questions) {
            if (err) throw err;
            return fn(null, questions);
        });
    });
}

function getResults(user_id, start_day, fn) {
    var results = [],
        total_points = 0,
        total_questions = 0,
        total_response_time = 0;
    var to_find = {
        user_id: user_id,
        date: {
            $gte: start_day
        }
    };
    if (!start_day) {
        delete to_find.date;
    }
    var history_query = models.QuizHistory.find(to_find);
    history_query.sort({
        date: 1
    });
    history_query.populate('question'); //Mongo equivalent of a RDBMS JOIN. Isn't she beautiful?!
    history_query.select('question choice_id response_time');
    history_query.lean();
    history_query.exec(function (err, questions) {
        var correct_answer = false;
        if (questions !== undefined) {
            questions.forEach(function (item, index, array) {
                total_questions++;
                if (item.question.answer == item.choice_id) {
                    correct_answer = true;
                    total_points++;
                } else {
                    correct_answer = false;
                }
                results[index] = {
                    'question_title': item.question.title,
                    'answer_title': item.question.choices[item.question.answer].choice_text,
                    'correct_answer': correct_answer,
                    'answer': item.question.answer,
                    'answer_chosen': item.choice_id,
                    'response_time': item.response_time
                };
                total_response_time += item.response_time;
            });
        } else {
            return fn(null, null);
        }
        results['total_points'] = total_points;
        results['total_questions'] = total_questions;
        results['avg_response_time'] = (total_response_time / total_questions).toFixed(3); //Round off to 3 decimals.
        return fn(null, results);
    });
}

module.exports = {
    findUserQuestionsForToday: findUserQuestionsForToday,
    findNextQuestion: findNextQuestion,
    timeCheck: timeCheck,
    saveAnswer: saveAnswer,
    getResults: getResults,
    saveQuestion: saveQuestion,
    deleteQuestion: deleteQuestion,
    getAllQuestions: getAllQuestions,
    getLastNtoMQuestions: getLastNtoMQuestions
}