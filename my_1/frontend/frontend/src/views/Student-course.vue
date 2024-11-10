<template>
  <el-container>
    <!-- 头部 -->
    <el-header>
      <div class="title">
        <img src="/favicon.ico" alt="平台图标" class="logo" />
        <span @click="menuClick('studentLayout')" style="font-size: 22px">
          观看课程
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
      <div class="card-container">
        <el-row :gutter="20" justify="space-around">
          <!-- 使用v-for循环生成20个课程卡片 -->
          <el-col :span="6" v-for="index in 20" :key="index" class="card-col">
            <div class="card-title">{{ '课程' + index }}</div>
            <el-card @click="menuClick(index)" class="card" shadow="hover">
              <!-- 修改图片路径为动态路径 -->
              <img :src="'/course_images/' + index + '.png'" alt="课程图标" class="card-icon" />
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import axios from "axios";
import {getToken, clearToken, getActivePath, setActivePath} from "../utils/storage.js";
import {ElMessage} from "element-plus";

export default {
  name: "StudentLearn",
  data() {
    return {
      user: {
        username: "",
        score: 0,
      },
      activePath: "",
      cardTitleColor: 'black', // 默认颜色
    };
  },
  methods: {
    // 导航栏点击事件
    menuClick(index) {
      // 生成对应的课程网址
      const baseUrl = "https://www.bilibili.com/video/BV1cp4y1P7uA?vd_source=4c56a3b2a9892d2cb345c9b25ad2c755&spm_id_from=333.788.videopod.episodes";
      const url = index > 1 ? `${baseUrl}&p=${index}` : baseUrl;
      // 使用window.open或this.$router.push打开新的页面
      window.open(url, '_blank');
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
    // 改变卡片标题颜色
    changeTitleColor() {
      this.cardTitleColor = '#409EFF'; // 鼠标悬停时的颜色
    },
    // 重置卡片标题颜色
    resetTitleColor() {
      this.cardTitleColor = 'black'; // 默认颜色
    },
    goBack() {
      this.$router.push({ path: '/student-learn' });
    },
  },
  created() {
    this.fetchUser();
  },
};
</script>

<style scoped>
.el-header {
  background-color: #409EFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid lightgrey;
  height: 60px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title {
  color: white;
}

.logo {
  width: 2vw;
  height: auto;
  margin-right: 10px;
}

.card-container {
  width: 90%; /* 设置容器宽度为页面宽度的90%，留有两侧空间 */
  margin: 20px auto; /* 设置上下边距，减少与顶部的空间 */
}

.card-col {
  text-align: center;
}

.card-title {
  font-size: 16px; /* 调整字体大小 */
  font-weight: bold;
  color: #409EFF; /* 设置标题颜色 */
  margin-top: 5px; /* 调整标题与卡片的间距 */
}

.card {
  width: 250px; /* 移除宽度限制，使其自适应图片宽度 */
  height: 130px; /* 移除高度限制，使其自适应图片高度 */
  border: 3px solid #dcdfe6; /* 保留边框 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: inline-flex; /* 使用flex布局以适应图片 */
  align-items: center; /* 垂直居中图片 */
  justify-content: center; /* 水平居中图片 */
}

.card:hover {
  transform: scale(1.05);
  border-color: #409EFF;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}


.card-icon {
  max-width: 250px; /* 确保图片不会超出卡片宽度 */
  max-height: 180px; /* 确保图片不会超出卡片高度 */
  height: auto; /* 保持图片比例 */
}

.welcome-message {
  font-size: 16px;
  color: white;
}

.user-score {
  font-size: 20px;
  color: grey;
}
</style>