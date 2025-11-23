module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    // ubah allowNull ke true supaya frontend boleh kosongkan email
    email: { type: DataTypes.STRING(200), allowNull: true, unique: true }
  }, {
    tableName: 'users'
  });

  return User;
};