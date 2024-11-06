import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from "./User.js";
import Question from "./Question.js"

const StudentAnswer = sequelize.define('StudentAnswer', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Question,
            key: 'id',
        },
    },
    //学生的答案
    selection: {
        type: DataTypes.STRING,
        allowNull:true,
    },
    //尝试答题次数
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
},
    {
        tableName: 'student_answers',
        timestamps: false,
    });

// 设置关联
StudentAnswer.associate = (models) => {
    StudentAnswer.belongsTo(models.User, {
        foreignKey: 'studentId',
        onDelete: 'CASCADE', // 如果用户被删除，相关的答案记录也被删除
    });
    StudentAnswer.belongsTo(models.Question, {
        foreignKey: 'questionId',
        onDelete: 'CASCADE', // 如果问题被删除，相关的答案记录也被删除
    });
};

export default StudentAnswer;