'use strict';
const moment = require('moment');
const Op = require('sequelize').Op;
const {
    Model, where
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Session extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Session.belongsTo(models.User, {
                foreignKey: 'userId',
            });
            Session.belongsTo(models.Sport, {
                foreignKey: 'sportId',
            });
        }

        static async getAllSessions() {
            const sessions = await this.findAll({
                attributes: ['id', 'location', 'date', 'required', 'sportId', "userId"]
            })
            return sessions.map((item) => item.dataValues)
        }

        static async getOlderSessions(sportId) {
            const oldSession = await this.findAll({
                where: {
                    date: {
                        [Op.lt]: moment().toDate()
                    },
                    sportId: sportId
                },
                attributes: ['id', 'location', 'date', 'required', 'sportId', "userId"]
            });
            return oldSession.map((item) => item.dataValues)
        }

        static async getNewerSessions(sportId) {
            const newSession = await this.findAll({
                where: {
                    date: {
                        [Op.gt]: moment().toDate()
                    },
                    sportId: sportId
                },
                attributes: ['id', 'location', 'date', 'required', 'sportId', "userId"]
            });
            return newSession.map((item) => item.dataValues)
        }


        static async getSessionById(id) {
            const session = await this.findOne({
                where: {
                    id: id
                },
                attributes: ['id', 'location', 'date', 'required', 'membersList', 'sportId', "userId"]
            })
            if (!session) return reportError('Session not found')
            return session.dataValues
        }

        static createNewSession(userId, body, sportId) {
            const dateBody = body.date.split('-').map((item) => parseInt(item));
            const timeBody = body.time.split(':').map((item) => parseInt(item));
            body.date = moment().set({
                year: dateBody[0],
                month: dateBody[1] - 1,
                date: dateBody[2],
                hour: timeBody[0],
                minute: timeBody[1],
                second: 0,
            })
            return this.create({
                userId: userId,
                sportId: Number(sportId),
                location: body.location,
                date: body.date,
                membersList: body.membersList.split(',').filter(item => item),
                required: body.required
            })
        }

        static async getCreatedSessions(userId) {
            const sessions = await this.findAll({
                where: {
                    userId: userId
                },
                attributes: ['id', 'location', 'date', 'required', 'sportId', "userId"]
            })
            const session = sessions.filter((item) => new Date(item.dataValues.date) > new Date())
            return session.map((item) => item.dataValues)
        }

        static async getJoinedSessions(userName) {
            const sessions = await this.findAll({
                where: {
                    membersList: {
                        [Op.contains]: [userName]
                    }
                },
                attributes: ['id', 'location', 'date', 'required', 'sportId', "userId"]
            })
            const session = sessions.filter((item) => new Date(item.dataValues.date) > new Date())
            return session.map((item) => item.dataValues)
        }

        static async joinSession(userName, sessionId) {
            const session = await this.getSessionById(sessionId)
            session.membersList.push(userName)
            return this.update({
                    membersList: session.membersList,
                    required: session.required - 1,
                },
                {
                    where: {
                        id: sessionId
                    }
                },
            )
        }

        static async leaveSession(index, sessionId) {
            const session = await this.getSessionById(sessionId)
            session.membersList.splice(index, 1)
            return this.update({
                    membersList: session.membersList,
                    required: session.required + 1,
                },
                {
                    where: {
                        id: sessionId
                    }
                },
            )
        }
    }

    Session.init({
        location: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Location is required"
                },
                notEmpty: {
                    msg: "Location is left empty"
                }
            }
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: {
                    msg: "Date must be a date"
                },
                notNull: {
                    msg: "Date is required"
                },
                notEmpty: {
                    msg: "Date is left empty"
                }
            }
        },
        membersList: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
        },
        required: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: {
                    msg: "Required must be a number"
                },
                notNull: {
                    msg: "Required is required"
                },
                notEmpty: {
                    msg: "Required is left empty"
                }
            }
        },
    }, {
        sequelize,
        modelName: 'Session',
    });
    return Session;
};