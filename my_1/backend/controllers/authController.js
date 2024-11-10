// backend/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Question from '../models/Question.js';
import StudentAnswer from '../models/StudentAnswer.js';

dotenv.config();

// 用户注册
export const register = async (req, res) => {
    const { username, password,classId,gender,telephone } = req.body;
    try {
        // 检查用户是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 哈希密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const newUser = await User.create({ username, password: hashedPassword,classId,gender,telephone });

        res.status(201).json({ message: '用户注册成功', user: { id: newUser.id, username: newUser.username } });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: '注册失败' });
    }
};

// 用户登录
export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ error: '用户不存在' });
        }

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: '密码不正确' });
        }

        // 生成 JWT
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ message: '登录成功', token });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败' });
    }
};

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
    try {
        // 包含 score 字段
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'score' ,'classId','gender','telephone','password'] // 确保包含 score 字段
        });
        if (!user) {
            return res.status(404).json({ error: '用户未找到' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: '无法获取用户信息' });
    }
};

// 更新用户分数
export const updateScore = async (req, res) => {
    const { scoreIncrease } = req.body; // 从请求体中获取分数增量
    const user = req.user; // 从中间件中获取当前用户对象

    try {
        const updatedUser = await User.findByPk(user.id);
        if (!updatedUser) {
            return res.status(404).json({ error: '用户未找到' });
        }

        // 检查用户是否已经达到分数上限
        const answeredQuestionsCount = updatedUser.score;
        if (answeredQuestionsCount >= process.env.MAX_QUESTIONS) {
            return res.status(400).json({ error: '已达到最大答题数量' });
        }

        // 更新分数
        updatedUser.score += scoreIncrease;
        await updatedUser.save();

        res.status(200).json({ message: '分数更新成功', newScore: updatedUser.score });
    } catch (error) {
        console.error('更新分数错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

//修改密码
export const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // 假设用户 ID 存储在 req.user 中

    try {
        // 查找用户
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 验证当前密码
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: '当前密码不正确' });
        }

        // 哈希新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新用户密码
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: '密码更新成功' });
    } catch (error) {
        console.error('更新密码错误:', error);
        res.status(500).json({ error: '密码更新失败' });
    }
};
// 更新用户信息
export const updateUserInfo = async (req, res) => {
    const { username, classId, gender, telephone } = req.body;
    const userId = req.user.id; // 假设用户 ID 存储在 req.user 中

    try {
        // 查找用户
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 更新用户信息
        user.username = username;
        user.classId = classId;
        user.gender = gender;
        user.telephone = telephone;

        await user.save(); // 保存更改到数据库

        res.status(200).json({ message: '用户信息更新成功', user });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ error: '用户信息更新失败' });
    }
};

// 根据题号获取题目详情
export const getQuestionById = async (req, res) => {
    const { id } = req.params; // 从请求参数中获取题号

    try {
        // 根据题号查询题目信息
        const question = await Question.findByPk(id, {
            attributes: ['id', 'questionImage', 'analysisImage', 'knowledgePoint', 'answer','optionA','optionB','optionC','optionD'],
            raw: true, // 返回原始数据，而不是 Sequelize 实例
        });

        if (!question) {
            return res.status(404).send({ message: '题目未找到' });
        }

        // 将图片数据转换为Base64编码
        const questionImageBase64 = question.questionImage.toString('base64');
        const analysisImageBase64 = question.analysisImage.toString('base64');

        // 创建响应对象，包含图片和文本信息
        const response = {
            id: question.id,
            questionImage: `data:image/jpeg;base64,${questionImageBase64}`, // 假设图片为JPEG格式
            analysisImage: `data:image/jpeg;base64,${analysisImageBase64}`, // 假设分析图为JPEG格式
            knowledgePoint: question.knowledgePoint,
            answer: question.answer,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD

        };

        // 发送响应
        res.status(200).json(response);
    } catch (error) {
        console.error('获取题目错误:', error);
        res.status(500).send({ message: '获取题目失败' });
    }
};

//记录答案
export const recordAnswer = async (req, res) => {
    const { studentId, questionId, selection } = req.body;

    try {
        // 检查用户是否存在
        const user = await User.findByPk(studentId);
        if (!user) {
            return res.status(404).json({ error: '用户未找到' });
        }

        // 检查问题是否存在
        const question = await Question.findByPk(questionId);
        if (!question) {
            return res.status(404).json({ error: '问题未找到' });
        }

        // 检查是否已有答案记录
        let studentAnswer = await StudentAnswer.findOne({
            where: {
                studentId,
                questionId
            }
        });

        if (studentAnswer) {
            // 如果记录存在，更新答案和尝试次数
            studentAnswer.selection += `,${selection}`;
            studentAnswer.attempts += 1;
            await studentAnswer.save();
        } else {
            // 如果记录不存在，创建新记录
            studentAnswer = await StudentAnswer.create({
                studentId,
                questionId,
                selection,
                attempts: 1 // 新记录时尝试次数为1
            });
        }

        res.status(200).json({ message: '答案记录成功', studentAnswer });
    } catch (error) {
        console.error('记录答案错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 获取用户答题信息
export const getUserAnswers = async (req, res) => {
    const { userId, selectedQuestionId } = req.params; // 获取路由参数
    try {
        // 根据userId和selectedQuestionId查询答案
        const answers = await StudentAnswer.findAll({
            where: { studentId: userId, questionId: selectedQuestionId },
            attributes: ['selection', 'questionId'],
            raw: true,
        });
        console.log('Raw Answers:', answers); // 打印所有检索到的答题记录

        const answerCounts = answers.reduce((acc, answer) => {
            // 将selection字段按逗号分割，然后对每个选项进行计数
            answer.selection.split(',').forEach(option => {
                acc[option] = (acc[option] || 0) + 1;
            });
            return acc;
        }, {});

        console.log('Answer Counts:', answerCounts); // 打印统计结果
        res.status(200).json(answerCounts);

    } catch (error) {
        console.error('获取用户答题信息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

export const getQuestions = async (req, res) => {
    try {
        const questions = await Question.findAll({
            attributes: ['id', 'questionImage', 'analysisImage', 'knowledgePoint', 'answer', 'optionA', 'optionB', 'optionC', 'optionD'],
        });
        res.status(200).json(questions);

    } catch (error) {
        console.error('获取题目列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};