// 全局变量
let currentPage = 1;
let totalPages = 8;
let startY = 0;
let isSwiping = false;
let shakeEnabled = false;
let hasPlayed = false;

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initMusic();
    initSwipe();
    initShake();
    
    // 延迟初始化动画，确保DOM完全加载
    setTimeout(() => {
        initSakuraAnimation();
    }, 100);
});

// ===== 音乐控制 =====
function initMusic() {
    const musicToggle = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');
    
    // 立即尝试播放（页面加载时）
    bgMusic.play().then(() => {
        hasPlayed = true;
        musicToggle.classList.remove('paused');
    }).catch(err => {
        // 如果自动播放失败，添加事件监听等待用户交互
        musicToggle.classList.add('paused');
        
        function tryPlayMusic() {
            if (!hasPlayed) {
                bgMusic.play().then(() => {
                    hasPlayed = true;
                    musicToggle.classList.remove('paused');
                }).catch(err => {});
            }
        }
        
        // 监听多种用户交互事件
        document.addEventListener('touchstart', tryPlayMusic, { once: true });
        document.addEventListener('click', tryPlayMusic, { once: true });
        document.addEventListener('touchmove', tryPlayMusic, { once: true });
    });
    
    // 点击音乐按钮切换播放/暂停
    musicToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (bgMusic.paused) {
            bgMusic.play().catch(err => {});
            musicToggle.classList.remove('paused');
        } else {
            bgMusic.pause();
            musicToggle.classList.add('paused');
        }
    });
}

// ===== 页面滑动切换 =====
function initSwipe() {
    const container = document.getElementById('pageContainer');
    
    // 触摸开始
    container.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        isSwiping = true;
    });
    
    // 触摸移动
    container.addEventListener('touchmove', function(e) {
        if (!isSwiping) return;
        e.preventDefault();
    }, { passive: false });
    
    // 触摸结束
    container.addEventListener('touchend', function(e) {
        if (!isSwiping) return;
        
        const endY = e.changedTouches[0].clientY;
        const diffY = startY - endY;
        
        // 向上滑动（下一页）
        if (diffY > 50 && currentPage < totalPages) {
            nextPage();
        }
        // 向下滑动（上一页）
        else if (diffY < -50 && currentPage > 1) {
            prevPage();
        }
        
        isSwiping = false;
    });

    // 鼠标滚轮支持（桌面端测试）
    let wheelTimeout;
    container.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            if (e.deltaY > 0 && currentPage < totalPages) {
                nextPage();
            } else if (e.deltaY < 0 && currentPage > 1) {
                prevPage();
            }
        }, 50);
    }, { passive: false });
}

// 下一页
function nextPage() {
    if (currentPage >= totalPages) return;
    
    const currentPageEl = document.querySelector('.page.active');
    const nextPageEl = document.querySelector(`.page[data-page="${currentPage + 1}"]`);
    
    currentPageEl.classList.remove('active');
    currentPageEl.classList.add('prev');
    
    nextPageEl.classList.add('active');
    nextPageEl.classList.remove('prev');
    
    currentPage++;
    
    // 切换动画到新页面
    startCurrentPageAnimation();
}

// 上一页
function prevPage() {
    if (currentPage <= 1) return;
    
    const currentPageEl = document.querySelector('.page.active');
    const prevPageEl = document.querySelector(`.page[data-page="${currentPage - 1}"]`);
    
    currentPageEl.classList.remove('active');
    
    prevPageEl.classList.remove('prev');
    prevPageEl.classList.add('active');
    
    currentPage--;
    
    // 切换动画到新页面
    startCurrentPageAnimation();
}

// ===== 桂花飘落动画（优化版） =====
let allCanvasAnimations = [];
let currentAnimationFrame = null;

function initSakuraAnimation() {
    // 清空之前的动画
    allCanvasAnimations = [];
    
    // 手动映射每个页面的canvas，确保对应关系正确
    const canvasMapping = [
        { canvas: document.getElementById('sakuraCanvas'), pageIndex: 1 },      // 第1页
        { canvas: document.querySelectorAll('.page-canvas')[0], pageIndex: 2 }, // 第2页
        { canvas: document.querySelectorAll('.page-canvas')[1], pageIndex: 3 }, // 第3页
        { canvas: document.querySelectorAll('.page-canvas')[2], pageIndex: 4 }, // 第4页
        { canvas: document.querySelectorAll('.page-canvas')[3], pageIndex: 5 }, // 第5页
        { canvas: document.querySelectorAll('.page-canvas')[4], pageIndex: 6 }, // 第6页
        { canvas: document.querySelectorAll('.page-canvas')[5], pageIndex: 7 }, // 第7页
        { canvas: document.getElementById('sakuraCanvas2'), pageIndex: 8 }      // 第8页
    ];
    
    canvasMapping.forEach(item => {
        const { canvas, pageIndex } = item;
        
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // 所有页面统一使用30个粒子，和第一页完全一样
        const particles = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(createSakuraParticle(canvas));
        }
        
        // 保存引用
        allCanvasAnimations.push({ 
            canvas, 
            particles, 
            ctx,
            pageIndex,
            animationId: null
        });
    });
    
    // 启动当前页面的动画
    startCurrentPageAnimation();
}

// 启动当前页面的动画
function startCurrentPageAnimation() {
    // 停止所有动画
    allCanvasAnimations.forEach(item => {
        if (item.animationId) {
            cancelAnimationFrame(item.animationId);
            item.animationId = null;
        }
    });
    
    // 找到当前页面对应的动画
    const currentAnimation = allCanvasAnimations.find(item => item.pageIndex === currentPage);
    
    if (currentAnimation) {
        function animate() {
            currentAnimation.ctx.clearRect(0, 0, currentAnimation.canvas.width, currentAnimation.canvas.height);
            
            currentAnimation.particles.forEach(particle => {
                updateParticle(particle, currentAnimation.canvas);
                drawParticle(currentAnimation.ctx, particle);
            });
            
            currentAnimation.animationId = requestAnimationFrame(animate);
        }
        
        animate();
    }
}

// 创建桂花粒子（初始分布在整个屏幕，和第一页一样）
function createSakuraParticle(canvas) {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height, // 随机分布在整个屏幕高度
        size: Math.random() * 15 + 10,
        speedY: Math.random() * 1 + 0.5,
        speedX: Math.random() * 0.5 - 0.25,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1
    };
}

// 更新粒子位置
function updateParticle(particle, canvas) {
    particle.y += particle.speedY;
    particle.x += particle.speedX;
    particle.rotation += particle.rotationSpeed;
    
    // 重置到顶部
    if (particle.y > canvas.height) {
        particle.y = -20;
        particle.x = Math.random() * canvas.width;
    }
    
    // 边界检查
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
}

// 绘制粒子（优化版，减少计算提升性能）
function drawParticle(ctx, particle) {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation * Math.PI / 180);
    
    // 简化绘制，使用更少的路径操作
    ctx.fillStyle = '#FFD700';
    ctx.shadowBlur = 5; // 减少阴影模糊以提升性能
    ctx.shadowColor = '#FFD700';
    
    // 五瓣花（优化版）
    const petalAngle = Math.PI * 2 / 5;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(0, -particle.size/3, particle.size/4, particle.size/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(petalAngle);
    }
    
    // 花心
    ctx.fillStyle = '#FFA500';
    ctx.shadowBlur = 0; // 花心不需要阴影
    ctx.beginPath();
    ctx.arc(0, 0, particle.size/5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// ===== 成分详情弹窗 =====
function showIngredientDetail(title, description) {
    const modal = document.getElementById('ingredientModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = description;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('ingredientModal');
    modal.classList.remove('show');
}

// ===== 砸金蛋游戏 =====
let eggsSmashed = 0;
let hasSmashed = false; // 标记是否已经砸过蛋

function enableShake() {
    if (hasSmashed) {
        showToast('今日机会已用完');
        return;
    }
    
    if (shakeEnabled) return;
    
    shakeEnabled = true;
    showToast('摇动手机或点击金蛋！');
    document.getElementById('shakeBtn').textContent = '摇动手机中...';
    document.getElementById('shakeBtn').style.opacity = '0.5';
}

function initShake() {
    // 检测设备晃动
    if (window.DeviceMotionEvent) {
        let lastX, lastY, lastZ;
        let lastTime = Date.now();
        
        window.addEventListener('devicemotion', function(e) {
            if (!shakeEnabled || hasSmashed) return;
            
            const acceleration = e.accelerationIncludingGravity;
            const currentTime = Date.now();
            
            if (currentTime - lastTime > 100) {
                const diffTime = currentTime - lastTime;
                lastTime = currentTime;
                
                const x = acceleration.x;
                const y = acceleration.y;
                const z = acceleration.z;
                
                if (lastX !== undefined) {
                    const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
                    
                    if (speed > 3000) {
                        // 检测到摇动，随机砸一个蛋
                        const randomIndex = Math.floor(Math.random() * 3);
                        smashEgg(randomIndex);
                    }
                }
                
                lastX = x;
                lastY = y;
                lastZ = z;
            }
        });
    }
}

function smashEgg(index) {
    // 检查是否已经砸过
    if (hasSmashed) {
        showToast('今日机会已用完，明天再来吧！');
        return;
    }
    
    const eggs = document.querySelectorAll('.egg');
    const egg = eggs[index];
    
    // 检查这个蛋是否已经被砸过
    if (egg.classList.contains('smashed')) {
        showToast('这个蛋已经碎了，请选择其他金蛋');
        return;
    }
    
    // 标记为已砸过
    hasSmashed = true;
    egg.classList.add('smashed');
    
    // 禁用摇动功能
    shakeEnabled = false;
    
    setTimeout(() => {
        // 随机奖品
        const prizes = [
            { name: '免费兑换券', probability: 0.1 },
            { name: '8折优惠券', probability: 0.3 },
            { name: '5元立减券', probability: 0.6 }
        ];
        
        const random = Math.random();
        let prize;
        
        if (random < prizes[0].probability) {
            prize = prizes[0].name;
        } else if (random < prizes[0].probability + prizes[1].probability) {
            prize = prizes[1].name;
        } else {
            prize = prizes[2].name;
        }
        
        showPrize(prize);
        
        // 更新按钮状态
        document.getElementById('shakeBtn').textContent = '今日已完成';
        document.getElementById('shakeBtn').style.opacity = '0.5';
        document.getElementById('shakeBtn').disabled = true;
    }, 500);
}

function showPrize(prize) {
    const modal = document.getElementById('prizeModal');
    document.getElementById('prizeText').textContent = `获得：${prize}`;
    modal.classList.add('show');
}

function closePrizeModal() {
    const modal = document.getElementById('prizeModal');
    modal.classList.remove('show');
}

// ===== Toast 提示 =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// ===== 门店信息（导航功能已移除，门店卡片仅作展示） =====

// ===== 关注公众号 =====
function followNow() {
    showToast('请使用微信扫描二维码关注');
}

// ===== 窗口大小调整 =====
window.addEventListener('resize', function() {
    // 调整所有canvas的大小
    allCanvasAnimations.forEach(item => {
        if (item.canvas) {
            item.canvas.width = window.innerWidth;
            item.canvas.height = window.innerHeight;
        }
    });
});

// 阻止默认的下拉刷新
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// 阻止双击缩放
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

