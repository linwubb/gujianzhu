// API 基础地址
const API_BASE_URL = 'http://localhost:8080/api';

// 全局变量
let currentUserId = null;
let currentPostId = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化...');
    checkLoginStatus();
    loadPosts();
});

// 检查登录状态
function checkLoginStatus() {
    const userId = localStorage.getItem('userId');
    console.log('检查登录状态，userId:', userId);
    if (userId) {
        currentUserId = userId;
        showLoggedInUI();
    }
}

// 显示已登录UI
function showLoggedInUI() {
    document.getElementById('userSection').innerHTML = `
        <span class="user-name">已登录</span>
        <button class="btn-login" onclick="logout()">退出</button>
    `;
    const publishLoginTip = document.getElementById('publishLoginTip');
    const publishForm = document.getElementById('publishForm');
    const commentForm = document.getElementById('commentForm');

    if (publishLoginTip) publishLoginTip.style.display = 'none';
    if (publishForm) publishForm.style.display = 'block';
    if (commentForm) commentForm.style.display = 'block';
}

// 退出登录
function logout() {
    localStorage.removeItem('userId');
    currentUserId = null;
    location.reload();
}

// 显示登录弹窗
function showLoginModal() {
    console.log('显示登录弹窗');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error('找不到登录弹窗元素');
    }
}

// 关闭登录弹窗
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

// 登录
async function login() {
    console.log('开始登录...');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const tip = document.getElementById('loginTip');

    if (!username || !password) {
        tip.className = 'error-message';
        tip.innerText = '请输入用户名和密码';
        return;
    }

    try {
        console.log('发送登录请求:', `${API_BASE_URL}/login`);
        const response = await fetch(`${API_BASE_URL}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('登录响应状态:', response.status);
        const data = await response.text();
        console.log('登录响应数据:', data);

        if (data.includes('登录成功')) {
            tip.className = 'success-message';
            tip.innerText = data;
            const userId = data.match(/用户ID：(\d+)/)?.[1];
            if (userId) {
                localStorage.setItem('userId', userId);
                currentUserId = userId;
                setTimeout(() => {
                    closeLoginModal();
                    showLoggedInUI();
                }, 1000);
            }
        } else {
            tip.className = 'error-message';
            tip.innerText = data;
        }
    } catch (error) {
        console.error('登录错误:', error);
        tip.className = 'error-message';
        tip.innerText = '登录失败，请检查后端服务是否启动 (http://localhost:8080)';
    }
}

// 发布帖子
async function publishPost() {
    if (!currentUserId) {
        showLoginModal();
        return;
    }

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const tip = document.getElementById('publishTip');

    if (!title || !content) {
        tip.className = 'error-message';
        tip.innerText = '请填写标题和内容';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/post/add?userId=${currentUserId}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`, {
            method: 'POST'
        });
        const data = await response.text();

        if (data.includes('成功')) {
            tip.className = 'success-message';
            tip.innerText = data;
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            setTimeout(() => {
                loadPosts();
            }, 1000);
        } else {
            tip.className = 'error-message';
            tip.innerText = data;
        }
    } catch (error) {
        tip.className = 'error-message';
        tip.innerText = '发布失败，请检查网络连接';
    }
}

// 加载帖子列表
async function loadPosts() {
    const postList = document.getElementById('postList');
    if (!postList) return;

    postList.innerHTML = '<div class="loading">正在加载帖子...</div>';

    try {
        console.log('加载帖子列表:', `${API_BASE_URL}/post/list`);
        const response = await fetch(`${API_BASE_URL}/post/list`);
        const posts = await response.json();
        console.log('获取到帖子:', posts.length, '条');

        if (posts.length === 0) {
            postList.innerHTML = '<div class="empty-state">暂无帖子，快来发布第一条吧！</div>';
            return;
        }

        postList.innerHTML = posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <span class="post-time">${formatTime(post.createTime)}</span>
                </div>
                <div class="post-content">${escapeHtml(post.content)}</div>
                <div class="post-footer">
                    <div class="post-stats">
                        <span class="stat-item" onclick="likePost(${post.id})">
                            <span class="stat-icon">&#x2764;</span>
                            <span class="stat-count">${post.likeCount || 0}</span>
                        </span>
                        <span class="stat-item" onclick="showComments(${post.id})">
                            <span class="stat-icon">&#x1F4AC;</span>
                            <span>评论</span>
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载帖子失败:', error);
        postList.innerHTML = '<div class="error-state">加载失败，请检查后端服务是否启动</div>';
    }
}

// 点赞
async function likePost(postId) {
    if (!currentUserId) {
        showLoginModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/post/like?userId=${currentUserId}&postId=${postId}`, {
            method: 'POST'
        });
        const data = await response.text();
        alert(data);
        loadPosts();
    } catch (error) {
        alert('操作失败，请检查网络连接');
    }
}

// 显示评论弹窗
async function showComments(postId) {
    currentPostId = postId;
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'flex';
    await loadPostDetail(postId);
    await loadComments(postId);
}

// 关闭评论弹窗
function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
    currentPostId = null;
}

// 加载帖子详情
async function loadPostDetail(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/post/list`);
        const posts = await response.json();
        const post = posts.find(p => p.id === postId);

        if (post) {
            const detailDiv = document.getElementById('commentPostDetail');
            if (detailDiv) {
                detailDiv.innerHTML = `
                    <h4>${escapeHtml(post.title)}</h4>
                    <p>${escapeHtml(post.content)}</p>
                    <div class="post-meta">
                        <span>点赞：${post.likeCount || 0}</span>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('加载帖子详情失败', error);
    }
}

// 加载评论列表
async function loadComments(postId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    commentsList.innerHTML = '<div class="loading">正在加载评论...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/comment/list/${postId}`);
        const comments = await response.json();

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="empty-state">暂无评论，快来发表第一条评论吧！</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-content">${escapeHtml(comment.content)}</div>
                <div class="comment-time">${formatTime(comment.createTime)}</div>
            </div>
        `).join('');
    } catch (error) {
        commentsList.innerHTML = '<div class="error-state">加载评论失败</div>';
    }
}

// 提交评论
async function submitComment() {
    if (!currentUserId) {
        showLoginModal();
        return;
    }

    const content = document.getElementById('commentContent').value.trim();
    if (!content) {
        alert('请输入评论内容');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/comment/add?postId=${currentPostId}&userId=${currentUserId}&content=${encodeURIComponent(content)}`, {
            method: 'POST'
        });
        const data = await response.text();
        alert(data);
        document.getElementById('commentContent').value = '';
        loadComments(currentPostId);
    } catch (error) {
        alert('评论失败，请检查网络连接');
    }
}

// 滚动到帖子区域
function scrollToPosts() {
    const postsSection = document.getElementById('posts');
    if (postsSection) postsSection.scrollIntoView({ behavior: 'smooth' });
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化时间
function formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN');
}

// 点击弹窗外部关闭
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const commentModal = document.getElementById('commentModal');
    if (event.target === loginModal) {
        closeLoginModal();
    }
    if (event.target === commentModal) {
        closeCommentModal();
    }
}

console.log('main.js 加载完成');
