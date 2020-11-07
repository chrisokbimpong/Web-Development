var config = require('../config/config'),
    user = require('../utils/user'),
    quiz = require('../utils/quiz'),
    stats = require('../utils/stats'),
    misc = require('../utils/misc'),
    path = require('path'),
    fs = require('fs'),
    date = require('date'),
    formidable = require('formidable'),
    ua_parser = require('ua-parser');

module.exports = function (app) {

    app.get(config.URL.QUIZ_ADMIN, function (req, res) {

        quiz.getAllQuestions(function (err, questions) {
            config.logger.info('QUIZ ADMIN - PAGE GET - RENDERING %s QUESTIONS.', questions.length);
            res.render(config.TEMPL_QUIZ_ADMIN, {
                questions: questions
            });
        });
    });

    app.get(config.URL.QUIZ_ADMIN_DATA, function (req, res) {

        stats.getTotalQuestionCount(function (err, total_questions) {
            stats.getUserDataForAdmin(function (err, results) {
                res.render(config.TEMPL_QUIZ_ADMIN_DATA, {
                    'user_data': results,
                    'total_questions': total_questions
                });
            });
        });
    });

    app.get(config.URL.QUIZ_ADMIN_FEEDBACK, function (req, res) {

        user.saveLastSeen(username, function (err, record) {
            req.session.last_seen = new Date();
            user.getFeedbackData(function (err, feedback_data) {
                feedback_data.forEach(function (item, index, array) {
                    var ua = item.feedback_data.user_agent,
                        user_agent = ua_parser.parseUA(ua).toString(),
                        os = ua_parser.parseOS(ua).toString(),
                        device = ua_parser.parseDevice(ua).toString();
                    device = (device == 'Other') ? 'Desktop' : device;
                    item.feedback_data['platform'] = [user_agent, os, device].join(' - ');
                });
                res.render(config.TEMPL_QUIZ_ADMIN_FEEDBACK, {
                    'feedback_data': feedback_data,
                    'UNREAD_COUNT': 0
                });
            });
        });
    });

    app.get(config.URL.QUIZ_ADMIN_ARCHIVE, function (req, res) {
        res.render(config.TEMPL_QUIZ_ADMIN_ARCHIVE);
    });

    app.get(config.URL.QUIZ_ADMIN_DATA_AJAX, function (req, res) {
        if (req.query.archive) {
            var table_data = [];

            quiz.getLastNtoMQuestions(0, 0, function (err, data) {
                data.forEach(function (item, index, array) {
                    item.title = misc.stripHTMLTags(item.title);
                    table_data.push([item.title, item.choices[item.answer].choice_text, item.date, item.allowed_time, item.image]);
                });
                res.json({
                    'sEcho': parseInt(req.query.sEcho),
                    'iTotalRecords': data.length,
                    'iTotalDisplayRecords': data.length,
                    'aaData': table_data
                });
            });
        }
    });

    app.post(config.URL.QUIZ_ADMIN_SAVE_AJAX, function (req, res) {

        var question_json = {
                'date': new Date(),
                'choices': {}
            },
            choice_counter = 1,
            form_name_counter = 0,
            req_body = req.body,
            question_id = null;

        for (var item in req_body) {
            var new_item = item.substring(0, item.lastIndexOf('-'));
            form_name_counter = item.substring(item.lastIndexOf('-') + 1, item.length);
            if (item.lastIndexOf('choice') === 0 && req_body[item].trim() !== '') {
                question_json['choices'][choice_counter] = {
                    'choice_text': req_body[item]
                };
                choice_counter++;
            } else {
                question_json[new_item] = (req_body[item]) ? req_body[item] : null;
            }
        }

        question_id = req_body['question_id-' + form_name_counter] ? req_body['question_id-' + form_name_counter] : null;
        delete question_json['question_id'];

        quiz.saveQuestion(question_id, question_json, function (err, question_id) {
            if (err) {
                config.logger.error('QUIZ ADMIN - FORM POST - SAVE FAILED!', {
                    username: req.session.user.username,
                    question_json: question_json,
                    question_id: question_id,
                    error: err
                });
                res.status(500);
                res.json({
                    'error': err,
                    'response': 'Question not saved!'
                });
            } else {
                config.logger.info('QUIZ ADMIN - FORM POST - QUESTION DOC SAVED IN DB', {
                    username: req.session.user.username,
                    question_json: question_json,
                    question_id: question_id
                });
                res.json({
                    'error': false,
                    'question_id': question_id
                });
            }
        });
    });

    app.delete(config.URL.QUIZ_ADMIN_SAVE_AJAX, function (req, res) {

        quiz.deleteQuestion(req.body.question_id, function (err, deleted_id) {
            if (err) {
                config.logger.error('QUIZ ADMIN - FORM DELETE - DELETION FAILED', {
                    username: req.session.user.username,
                    question_id: req.body.question_id,
                    error: err
                });
                res.json({
                    'error': true,
                    'response': err.message
                })
            } else {
                config.logger.info('QUIZ ADMIN - FORM DELETE - QUESTION DOC DELETED FROM DB', {
                    username: req.session.user.username,
                    deleted_question_id: deleted_id
                });
                res.json({
                    'error': false,
                    'deleted_id': deleted_id
                });
            }
        })
    });

    app.delete(config.URL.QUIZ_ADMIN_SAVE_UPLOAD, function (req, res) {
        var file_name = path.join(__dirname, '/public/', config.UPLOAD_DIR, req.body.file_name);
        fs.unlink(file_name, function (err) {
            if (err) {
                config.logger.warn('QUIZ ADMIN - IMAGE DELETE FAILED', {
                    request_body: req.body
                });
            }
            res.send(null);
        });
    });

    app.post(config.URL.QUIZ_ADMIN_SAVE_UPLOAD, function (req, res) {

        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var old_path = files.file.path,
                image_size = files.file.size,
                file_ext = files.file.name.split('.').pop(),
                index = old_path.lastIndexOf('/') + 1,
                file_name = old_path.substr(index),
                new_path = path.join(config.APP_BASE_PATH, '/public/', config.UPLOAD_DIR, file_name + '.' + file_ext);

            config.logger.info('QUIZ ADMIN - UPLOAD IMAGE POST - PARSED PARAMETERS', {
                old_path: old_path,
                new_path: new_path,
                image_size: image_size
            });

            fs.readFile(old_path, function (err, data) {
                fs.writeFile(new_path, data, function (err) {
                    fs.unlink(old_path, function (err) {
                        if (err) {
                            res.status(500);
                            res.json({
                                'error': err.message
                            });
                        } else {
                            res.json({
                                'error': false,
                                'file_path': file_name + '.' + file_ext,
                                'image_size': image_size
                            });
                        }
                    });
                });
            });
        });
    });
}