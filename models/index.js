const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = require('./user')(sequelize, Sequelize.DataTypes);
const ApiKey = require('./apiKey')(sequelize, Sequelize.DataTypes);
const Admin = require('./admin')(sequelize, Sequelize.DataTypes);

// Relations
User.hasMany(ApiKey, { foreignKey: 'userId', as: 'apiKeys', onDelete: 'CASCADE' });
ApiKey.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { sequelize, Sequelize, User, ApiKey, Admin };
