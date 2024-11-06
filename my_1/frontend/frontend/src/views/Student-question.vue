<template>
  <el-card>
    <div class="question-container">
      <el-header>
        <div class="header-left">
          <span class="title">答题模式</span>
        </div>
        <div class="header-right">
          <el-button @click="goBack" class="back-button" type="danger">返回</el-button>
        </div>
      </el-header>
      <el-main>
        <div class="question-box">
          <h2>{{ currentQuestion.knowledgePoint }}</h2>
          <img :src="currentQuestion.questionImage" alt="题目图片" class="question-image">
          <form @submit.prevent="checkAnswer">
            <div v-for="(option, index) in ['A', 'B', 'C', 'D']" :key="index" class="option">
              <el-radio v-model="selectedAnswer" :label="option">
                {{ option === 'A' ? currentQuestion.optionA : option === 'B' ? currentQuestion.optionB : option === 'C' ? currentQuestion.optionC : currentQuestion.optionD }}
              </el-radio>
            </div>
            <el-button type="primary" native-type="submit" :disabled="isAnswerSubmitted">提交答案</el-button>
          </form>
          <!-- 只有当回答正确且还有下一题时才显示“下一题”按钮 -->
          <button v-if="isAnswerSubmitted && isCorrect " @click="nextQuestion" class="next-question-btn">下一题</button>
          <p v-if="isAnswerSubmitted" :class="{ 'correct': isCorrect, 'wrong': !isCorrect }">{{ result }}</p>
          <img v-if="isAnswerSubmitted" :src="currentQuestion.analysisImage" alt="解析图片" class="analysis-image">
        </div>
      </el-main>
    </div>
  </el-card>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Question',
  data() {
    return {
      currentQuestionIndex: 0,
      questions: [], // 移除了图片路径数组，将从API获取
      selectedAnswer: '',
      isCorrect: null,
      result: '',
      isAnswerSubmitted: false,
      hasNext: true,
      answeredQuestions: [],
      currentQuestion: {}, // 用于存储当前题目的详细信息

    };
  },

  methods: {
    async fetchQuestion(id) {
      try {
        const response = await axios.get(`/api/auth/questions/${id}`);
        this.currentQuestion = response.data;
        console.log(`Fetched question with id: ${id}, question data:`, this.currentQuestion);

      } catch (error) {
        console.error('获取题目错误:', error);
      }

    },
    async checkAnswer() {
      const correctAnswer = this.currentQuestion.answer;
      this.isCorrect = this.selectedAnswer === correctAnswer;
      this.result = this.isCorrect
          ? "回答正确！"
          : `回答错误！正确答案是：${correctAnswer}`;
      this.isAnswerSubmitted = true;

      // 获取当前用户信息
      const token = localStorage.getItem('token');
      const userResponse = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });



      if (userResponse.data && userResponse.data.user) {
        const currentUser = userResponse.data.user;
        const userScore = currentUser.score;
        // 记录答案和尝试次数
        const studentAnswerData = {
          studentId: currentUser.id,
          questionId: this.currentQuestion.id,
          selection: this.selectedAnswer,
          attempts: 1 // 每次尝试次数加一
        };
        console.log('Sending to server:', studentAnswerData); // 打印发送的数据

        try {
          await axios.post('/api/auth/record-answer', studentAnswerData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('记录答案时发生错误:', error);
        }

        // 检查是否回答正确且题目序号大于用户分数
        if (this.isCorrect && this.currentQuestionIndex > userScore && !this.answeredQuestions.includes(this.currentQuestionIndex)) {
          try {
            const response = await axios.post('/api/auth/update-score', { scoreIncrease: 1 }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            console.log(response.data.message);
            if (response.data.message === '分数更新成功') {
              this.answeredQuestions.push(this.currentQuestionIndex);
            } else {
              console.error('分数更新失败');
            }
          } catch (error) {
            console.error('更新分数时发生错误:', error);
          }
        }
      }

    },
    async nextQuestion() {
      const nextQuestionIndex = this.currentQuestionIndex + 1;
      try {
        // 尝试获取下一题
        await this.fetchQuestion(nextQuestionIndex);
        console.log(`Fetching question with index: ${nextQuestionIndex}`);
        // 如果没有错误，说明成功获取到了下一题
        this.currentQuestionIndex = nextQuestionIndex;
        this.selectedAnswer = '';
        this.result = '';
        this.isCorrect = null;
        this.isAnswerSubmitted = false;
      } catch (error) {
        // 如果请求失败，说明没有更多问题了
        console.error('获取下一题失败:', error);
        alert("已经没有更多问题了！");
        this.currentQuestionIndex = 0;
        this.isAnswerSubmitted = false;
      }
    },

    goBack() {
      this.$router.push({ path: '/student-pass' });
    },
  },
  created() {
    // 假设从路由参数中获取关卡ID
    const levelId = this.$route.params.levelId;
    if (levelId) {
      this.currentQuestionIndex = Number(levelId) ;
      this.fetchQuestion(levelId); // 获取当前题目详情
    }
  }
};
</script>

<style scoped>
.question-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.el-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #409EFF;
  color: white;
  height: 60px;
}

.header-left .title {
  font-size: 22px;
}

.header-right {
  display: flex;
  align-items: center;
}

.el-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.question-box {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px; /* 圆角边框 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* 盒子阴影 */
  width: 90%; /* 限制宽度 */
  max-width: 600px; /* 最大宽度 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.question-image {
  width: 100%; /* 使图片宽度适应容器 */
  max-width: 600px; /* 最大宽度 */
  margin-bottom: 20px; /* 增加底部间距 */
}

.analysis-image {
  width: 100%; /* 使图片宽度适应容器 */
  max-width: 600px; /* 最大宽度 */
  margin-top: 20px; /* 增加顶部间距 */
}

h2 {
  color: #333;
  font-size: 24px; /* 增加字体大小 */
  margin-bottom: 20px; /* 增加底部间距 */
}

.option {
  margin: 15px 0;
}

.el-radio__label {
  font-size: 18px; /* 增加选项的字体大小 */
}

.next-question-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #5cb85c;
  color: white;
  border: none;
  border-radius: 20px; /* 圆角边框 */
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease; /* 过渡效果 */
}

.next-question-btn:hover {
  background-color: #4cae4c; /* 悬停效果 */
}

.correct {
  color: green;
  margin-top: 10px; /* 增加顶部间距 */
}

.wrong {
  color: red;
  margin-top: 10px; /* 增加顶部间距 */
}
</style>