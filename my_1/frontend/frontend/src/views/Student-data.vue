<template>
  <el-container>
    <!-- 头部 -->
    <el-header>
      <div class="title">
        <img src="/favicon.ico" alt="平台图标" class="logo" />
        <span @click="menuClick('studentLayout')" style="font-size: 22px">
          答题数据
        </span>
      </div>
      <div class="header-right">
        <span class="welcome-message" style="font-size: 20px">欢迎您，{{ user.username || '加载中...' }}!</span>
        <span class="user-score">得分: {{ user.score}} 分</span>
        <el-button @click="goBack" class="back-button" type="danger">返回</el-button>
      </div>
    </el-header>

    <!-- 内容区域 -->
    <el-main>
      <!-- 选择题目 -->
      <el-select v-model="selectedQuestionId" placeholder="选择题目" @change="fetchQuestionAnswers" class="question-select">
        <el-option
            v-for="question in questions"
            :key="question.id"
            :label="`题目 ${getQuestionNumber(question.id)}`"
            :value="question.id">
        </el-option>
      </el-select>

      <!-- 图表容器 -->
      <div class="chart-container">
        <h2>{{ getQuestionNumber(selectedQuestionId) }}</h2>
        <div ref="chart" class="chart"></div>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import axios from "axios";
import * as echarts from 'echarts';
import { getToken, clearToken, getActivePath, setActivePath } from "../utils/storage.js";
import { ElMessage } from "element-plus";

export default {
  name: "StudentData",
  data() {
    return {
      user: {
        username: "",
        score: 0,
      },
      activePath: "",
      selectedQuestionId: null,
      questions: [],
      userAnswers: {},
      chart: null,
    };
  },
  methods: {
    // 导航栏点击事件
    menuClick(path) {
      this.activePath = path;
      setActivePath(path);
      if (this.$route.path !== "/" + path) this.$router.push(path);
      console.log(path);
    },

    // 获取用户信息
    async fetchUser() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('API Response:', response.data);

        if (response.data && response.data.user) {
          this.user = response.data.user;
          console.log('User data:', this.user);
        } else {
          console.log('User data not found in API response.');
        }
      } catch (error) {
        ElMessage.error('无法获取用户信息');
        console.log('Error fetching user data:', error);
      }
    },

    // 获取题目列表
    async fetchQuestions() {

      try {
        const response = await axios.get('/api/auth/questions-all');
        this.questions = response.data;
      } catch (error) {
        ElMessage.error('无法获取题目列表');
        console.log('Error fetching questions:', error);
      }
    },

    // 获取用户答题信息
    async fetchQuestionAnswers() {
      if (!this.selectedQuestionId) return;
      try {
        const token = localStorage.getItem('token');
        const userId = this.user.id; // 假设用户ID存储在this.user.id中
        console.log(`Fetching user answers for question ID: ${this.selectedQuestionId} and user ID: ${userId}`); // 输出请求的questionId和userId

        const response = await axios.get(`/api/auth/user-answers/${userId}/${this.selectedQuestionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('User Answers API Response:', response.data);
        this.userAnswers = response.data;
        console.log('Fetched User Answers:', this.userAnswers); // 输出获取到的用户答题信息
        this.drawChart();
      } catch (error) {
        ElMessage.error('无法获取用户答题信息');
        console.log('Error fetching user answers:', error);
      }
    },

    // 绘制图表
    drawChart() {
      if (this.chart) {
        this.chart.dispose();
      }
      this.chart = echarts.init(this.$refs.chart);
      console.log('User Answers:', this.userAnswers); // 输出用户答题信息以供检查

      const options = {
        title: {
          text: '选项统计'
        },
        tooltip: {},
        legend: {
          data: ['选项A', '选项B', '选项C', '选项D']
        },
        xAxis: {
          type: 'category',
          data: ['选项A', '选项B', '选项C', '选项D'],
          name: '选项' // 设置横坐标名称
        },
        yAxis: {
          type: 'value',
          name: '次数', // 设置纵坐标名称
          axisLabel: {
            formatter: function(value) {
              return parseInt(value); // 格式化为整数，去除小数部分
            }
          },
          min: 0, // 设置纵坐标的最小值为0
          max: Math.max(...['A', 'B', 'C', 'D'].map(option => this.userAnswers[option] || 0), 1), // 设置纵坐标的最大值
          interval: 1 // 设置纵坐标的间隔为1
        },
        series: [{
          name: '答题次数',
          type: 'bar',
          data: ['A', 'B', 'C', 'D'].map(option => this.userAnswers[option] || 0)
        }]
      };
      this.chart.setOption(options);
    },

    // 获取题目编号
    getQuestionNumber(id) {
      const index = this.questions.findIndex(question => question.id === id);
      return index + 1 ? `第${index + 1}题` : '请选择题目';
    },

    goBack() {
      this.$router.push({path: '/student-home'});
    },
  },
  created() {
    this.fetchUser();
    this.fetchQuestions();

  },
};
</script>

<style scoped>
.el-header {
  background-color: #409EFF;
  display: flex;
  justify-content: space-between; /* Align title on the left, user info on the right */
  align-items: center;
  border-bottom: 1px solid lightgrey;
  height: 60px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px; /* Adds space between the elements */
}

.title {
  color: white;
}

.logo {
  width: 2vw; /* 宽度为视口宽度的2% */
  height: auto; /* 自动保持宽高比 */
  margin-right: 10px;
}

.welcome-message {
  font-size: 16px;
  color: white;
}

.user-score {
  font-size: 20px;
  color: grey;
}

.el-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.question-select {
  margin: 20px 0;
}

.chart-container {
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

.chart {
  width: 100%; /* 使图表宽度适应容器 */
  max-width: 600px; /* 最大宽度 */
  height: 400px;
}
</style>