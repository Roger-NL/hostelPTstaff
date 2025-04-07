import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { getScaleFactors, calculateResponsiveSize } from '../utils/viewportNormalizer';

interface ScaledContainerProps {
  children: ReactNode;
  className?: string;
  baseWidth?: number;
  baseHeight?: number;
  minScale?: number;
  maxScale?: number;
  preserveAspectRatio?: boolean;
  style?: React.CSSProperties;
}

/**
 * Componente que aplica escala consistente aos seus filhos baseado no viewportNormalizer
 * Garante que o conteúdo tenha o mesmo tamanho proporcional em qualquer dispositivo
 */
const ScaledContainer: React.FC<ScaledContainerProps> = ({
  children,
  className = '',
  baseWidth = 375, // Base de design padrão (iPhone 8)
  baseHeight = 667,
  minScale = 0.8,
  maxScale = 1.2,
  preserveAspectRatio = true,
  style = {},
}) => {
  const [scale, setScale] = useState(1);
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Função para calcular a escala baseada no tamanho da tela
    const calculateScale = () => {
      const scaleFactor = getScaleFactors();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calcular escala baseada na largura e altura
      const widthRatio = screenWidth / baseWidth;
      const heightRatio = screenHeight / baseHeight;
      
      // Usar a menor proporção se for para preservar a proporção
      let calculatedScale = preserveAspectRatio 
        ? Math.min(widthRatio, heightRatio) 
        : widthRatio;
      
      // Aplicar limites mínimos e máximos
      calculatedScale = Math.max(minScale, Math.min(calculatedScale, maxScale));
      
      // Ajustar para densidade de pixels em telas de alta resolução
      if (window.devicePixelRatio > 2) {
        calculatedScale *= 0.95; // Pequeno ajuste para telas de alta densidade
      }
      
      setScale(calculatedScale);
      
      // Criar estilo com transformação de escala
      setContainerStyle({
        transform: `scale(${calculatedScale})`,
        transformOrigin: 'center top',
        width: baseWidth,
        height: preserveAspectRatio ? baseHeight : 'auto',
        margin: '0 auto',
        ...style
      });
    };
    
    // Calcular escala inicial
    calculateScale();
    
    // Recalcular quando a janela for redimensionada
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    
    // Limpar
    return () => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('orientationchange', calculateScale);
    };
  }, [baseWidth, baseHeight, minScale, maxScale, preserveAspectRatio, style]);
  
  // Efeito para corrigir o problema de coordenadas em elementos escalonados
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Função para ajustar os eventos de clique/toque
    const adjustClickCoordinates = (e: MouseEvent | TouchEvent) => {
      // Se não for dentro do nosso contêiner, não fazer nada
      if (!containerRef.current?.contains(e.target as Node)) return;
      
      // Vamos ajustar eventos apenas em elementos interativos
      const targetElement = e.target as HTMLElement;
      const isInteractive = 
        targetElement.tagName === 'BUTTON' || 
        targetElement.tagName === 'A' ||
        targetElement.tagName === 'INPUT' ||
        targetElement.tagName === 'SELECT' ||
        targetElement.tagName === 'TEXTAREA' ||
        targetElement.getAttribute('role') === 'button';
        
      if (!isInteractive) return;
      
      // Não precisamos corrigir se a escala for aproximadamente 1
      if (scale > 0.99 && scale < 1.01) return;
      
      // Para eventos de toque, aplicar a correção para cada toque
      if (e.type.startsWith('touch')) {
        const touchEvent = e as TouchEvent;
        
        // Não modificamos o evento diretamente, mas os elementos já recebem as coordenadas corrigidas
        // Isso apenas impede a prevenção incorreta de eventos
        e.stopPropagation();
      }
    };
    
    // Adicionar listeners para eventos de mouse e toque
    containerRef.current.addEventListener('click', adjustClickCoordinates, true);
    containerRef.current.addEventListener('touchstart', adjustClickCoordinates, true);
    containerRef.current.addEventListener('touchend', adjustClickCoordinates, true);
    
    return () => {
      containerRef.current?.removeEventListener('click', adjustClickCoordinates, true);
      containerRef.current?.removeEventListener('touchstart', adjustClickCoordinates, true);
      containerRef.current?.removeEventListener('touchend', adjustClickCoordinates, true);
    };
  }, [scale, containerRef.current]);

  return (
    <div className={`scaled-container ${className}`} style={containerStyle} ref={containerRef}>
      {children}
    </div>
  );
};

/**
 * Componente para elementos com dimensões consistentes em qualquer dispositivo
 */
interface ScaledElementProps {
  children?: ReactNode;
  className?: string;
  originalWidth?: number;
  originalHeight?: number;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export const ScaledElement: React.FC<ScaledElementProps> = ({
  children,
  className = '',
  originalWidth = 100,
  originalHeight,
  style = {},
  onClick,
}) => {
  const [elementStyle, setElementStyle] = useState<React.CSSProperties>({});
  
  useEffect(() => {
    // Calcular dimensões responsivas
    const width = calculateResponsiveSize(originalWidth, 'width');
    const height = originalHeight ? calculateResponsiveSize(originalHeight, 'height') : undefined;
    
    setElementStyle({
      width: `${width}px`,
      ...(height && { height: `${height}px` }),
      ...style
    });
  }, [originalWidth, originalHeight, style]);
  
  return (
    <div 
      className={`scaled-element ${className}`} 
      style={elementStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/**
 * Componente que aplica tamanhos de fonte consistentes
 */
interface ScaledTextProps {
  children: ReactNode;
  className?: string;
  originalSize?: number;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  onClick?: (e: React.MouseEvent) => void;
}

export const ScaledText: React.FC<ScaledTextProps> = ({
  children,
  className = '',
  originalSize = 16,
  style = {},
  as: Component = 'span',
  onClick,
}) => {
  const [textStyle, setTextStyle] = useState<React.CSSProperties>({});
  
  useEffect(() => {
    // Calcular tamanho da fonte responsivo
    const fontSize = calculateResponsiveSize(originalSize, 'width');
    
    setTextStyle({
      fontSize: `${fontSize}px`,
      ...style
    });
  }, [originalSize, style]);
  
  return (
    <Component 
      className={`scaled-text ${className}`} 
      style={textStyle}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

export default ScaledContainer; 