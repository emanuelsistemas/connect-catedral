// Script simplificado para mostrar a seta ao clicar nos cards
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de seta de download carregado - versão simplificada');

    // Adicionar botões de indicação em cada card ao iniciar a página
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // Criar botão indicador para cada card
        const indicatorButton = document.createElement('button');
        indicatorButton.textContent = 'Clique para baixar';
        indicatorButton.className = 'indicator-button';
        indicatorButton.style.position = 'absolute';
        indicatorButton.style.bottom = '100px';
        indicatorButton.style.left = '50%';
        indicatorButton.style.transform = 'translateX(-50%)';
        indicatorButton.style.backgroundColor = index === 0 ? '#2563eb' : '#dc2626';
        indicatorButton.style.color = 'white';
        indicatorButton.style.border = 'none';
        indicatorButton.style.borderRadius = '8px';
        indicatorButton.style.padding = '10px 15px';
        indicatorButton.style.fontSize = '14px';
        indicatorButton.style.fontWeight = 'bold';
        indicatorButton.style.cursor = 'pointer';
        indicatorButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
        indicatorButton.style.zIndex = '1000';
        indicatorButton.style.display = 'none';
        
        // Adicionar ao card
        card.appendChild(indicatorButton);
        
        // Adicionar seta ao botão
        const arrow = document.createElement('div');
        arrow.className = 'download-arrow';
        arrow.style.position = 'absolute';
        arrow.style.bottom = '-40px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.width = '30px';
        arrow.style.height = '30px';
        arrow.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ffffff\' stroke-width=\'3\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 14l-7 7m0 0l-7-7m7 7V3\' /%3E%3C/svg%3E")';
        arrow.style.backgroundSize = 'contain';
        arrow.style.backgroundRepeat = 'no-repeat';
        indicatorButton.appendChild(arrow);
        
        // Adicionar evento ao card
        card.addEventListener('click', function(e) {
            // Evitar clicar no botão de download diretamente
            if (e.target.closest('.download-btn') || e.target.closest('a[href]') || e.target === indicatorButton) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Esconder todos os indicadores primeiro
            document.querySelectorAll('.indicator-button').forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Mostrar o indicador deste card
            indicatorButton.style.display = 'block';
            
            // Animar o botão
            let opacity = 0;
            indicatorButton.style.opacity = '0';
            
            const fadeIn = setInterval(() => {
                opacity += 0.1;
                indicatorButton.style.opacity = opacity;
                
                if (opacity >= 1) {
                    clearInterval(fadeIn);
                    
                    // Adicionar animação de pulso
                    indicatorButton.style.animation = 'pulse 1.5s infinite';
                    
                    // Esconder após 5 segundos
                    setTimeout(() => {
                        const fadeOut = setInterval(() => {
                            opacity -= 0.1;
                            indicatorButton.style.opacity = opacity;
                            
                            if (opacity <= 0) {
                                clearInterval(fadeOut);
                                indicatorButton.style.display = 'none';
                                indicatorButton.style.animation = '';
                            }
                        }, 50);
                    }, 5000);
                }
            }, 50);
        });
        
        // Adicionar evento ao botão indicador
        indicatorButton.addEventListener('click', function() {
            // Simular clique no botão de download
            const downloadBtn = card.querySelector('.download-btn');
            if (downloadBtn) {
                downloadBtn.click();
            }
        });
    });
    
    // Adicionar estilo para a animação de pulso
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
});

// Garantir que o script seja executado mesmo se a página já estiver carregada
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
    }, 100);
}
