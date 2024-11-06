import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';


const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    questionImage: {
        type: DataTypes.BLOB,
        allowNull: false,
    },
    analysisImage: {
        type: DataTypes.BLOB,
        allowNull: false,
    },
    knowledgePoint: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    answer:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    optionA:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    optionB:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    optionC:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    optionD:{
        type: DataTypes.STRING,
        allowNull: false,
    }

},
    {
        tableName: 'questions',
        timestamps: false,
    });


export default Question;