var express = require('express');
var router = express.Router();
const logger = require('../../../helper/logger');
const db = require('../../../models');
const { ErrorCodes, NotFoundError, ApplicationError, UserError } = require('../../../helper/errors');
const { checkAccess} = require('../../../auth/jwt')
const Sequelize = db.Sequelize;
const errorBody = (err) => ({ code: err.code, message: err.message });

const authRouter = require('./auth');
const routeRouter = require('./routeConfig')

router.use('/auth', authRouter);
router.use('/route', checkAccess ,routeRouter);


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

// handle all not found errors
router.use(function (req, res, next) {
    const err = new NotFoundError(req.url);
    logger.error(err + ' USER ID');
    res.status(404).send(errorBody(err));
});

// error handler
router.use(function (err, req, res, next) {
    // set locals, only providing error in development
    logger.error(err);
    if (err instanceof Sequelize.ForeignKeyConstraintError) {
        logger.alert(err);
        err = new UserError('This resource is being used by some other resource', ErrorCodes.ERR_VALIDATION);
    } else if (err instanceof Sequelize.ValidationError) {
        logger.alert(err);
        err = new UserError('validation failed', ErrorCodes.ERR_VALIDATION);
    } else if (err instanceof Sequelize.DatabaseError) {
        logger.alert(err);
        err = new UserError('validation failed', ErrorCodes.ERR_DATABASE, 500);
    } else if (err instanceof Sequelize.TimeoutError) {
        logger.alert(err);
        err = new UserError('database query timeout', ErrorCodes.ERR_DATABASE_TIMEOUT, 500);
    } else if (err instanceof Sequelize.UniqueConstraintError) {
        logger.alert(err);
        err = new UserError('already existis', ErrorCodes.ERR_VALIDATION);
    } else if (err instanceof Sequelize.Error) {
        logger.alert(err);
        err = new UserError('Something went wrong!!');
    } else if ((err instanceof Error && err.name === 'ValidationError')
        || (err instanceof ApplicationError)) {
        err = err;
    } else {
        logger.alert(err);
        err = new UserError(err?.message ? err.message : 'Something went wrong!!');
    }
    res.status(err.httpCode || 400).send(errorBody(err));
});

module.exports = router;
