// 导航页面交互效果

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', function() {
    console.log('游戏导航页面加载完成');
    
    // 添加页面加载动画
    document.body.classList.add('loaded');
    
    // 为游戏卡片添加进入动画
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // 为开始游戏按钮添加悬停效果
    const playButtons = document.querySelectorAll('.play-btn');
    playButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // 平滑滚动功能
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 监听滚动，为页面添加动态效果
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        const header = document.querySelector('header');
        
        // 根据滚动位置调整头部样式
        if (scrollY > 50) {
            header.style.opacity = '0.9';
            header.style.transform = 'translateY(-10px)';
        } else {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }
        
        // 为在视口中的游戏卡片添加动画
        gameCards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const isInViewport = (
                cardRect.top <= window.innerHeight * 0.75 &&
                cardRect.bottom >= 0
            );
            
            if (isInViewport) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    });
    
    // 初始化游戏卡片样式
    gameCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
});

// 添加键盘快捷键功能
window.addEventListener('keydown', function(e) {
    // 按数字键1-4直接跳转到对应的游戏
    switch(e.key) {
        case '1':
            window.location.href = '../Single-player Snake/index.html';
            break;
        case '2':
            window.location.href = '../Minesweeper/index.html';
            break;
        case '3':
            window.location.href = '../TankTrouble/index.html';
            break;
        case '4':
            window.location.href = '../Two-player Snake/index.html';
            break;
    }
});

// 添加游戏类型快速导航功能
function scrollToCategory(categoryType) {
    const category = document.querySelector(`.game-category:nth-of-type(${categoryType === 'single' ? '1' : '2'})`);
    if (category) {
        window.scrollTo({
            top: category.offsetTop - 100,
            behavior: 'smooth'
        });
    }
}