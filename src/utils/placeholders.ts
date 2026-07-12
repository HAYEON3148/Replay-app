/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Elegant mathematics and english problem SVGs converted to data URLs or inline markup
export const placeholderImages: Record<string, string> = {
  '/assets/placeholder_math22.png': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background-color:%23ffffff;font-family:sans-serif;color:%23111111;padding:40px;">
    <rect width="100%" height="100%" fill="%23ffffff" stroke="%23e5e7eb" stroke-width="2"/>
    <text x="40" y="50" font-size="18" font-weight="bold" fill="%231f2937">[문제 22] 최고차항의 계수가 1인 삼차함수 f(x)가 다음 조건을 만족한다.</text>
    <text x="40" y="90" font-size="15" fill="%234b5563">(가) 함수 g(x) = f(x-3) + f(x+3) 은 x = 0에서 극대값을 갖는다.</text>
    <text x="40" y="120" font-size="15" fill="%234b5563">(나) 방정식 f(x) = 0 의 서로 다른 실근의 개수는 2이다.</text>
    <text x="40" y="160" font-size="15" fill="%23111111">f(1) = 4 일 때, f(5) 의 값을 구하시오.</text>
    <path d="M 150 350 C 250 150, 350 380, 450 180" fill="none" stroke="%233b82f6" stroke-width="3"/>
    <line x1="100" y1="300" x2="500" y2="300" stroke="%239ca3af" stroke-width="1.5" stroke-dasharray="4"/>
    <text x="510" y="305" font-size="12" fill="%236b7280">x</text>
    <line x1="200" y1="150" x2="200" y2="350" stroke="%239ca3af" stroke-width="1.5" stroke-dasharray="4"/>
    <text x="195" y="140" font-size="12" fill="%236b7280">y</text>
    <circle cx="200" cy="300" r="4" fill="%23ef4444"/>
    <text x="210" y="315" font-size="12" fill="%23ef4444">O</text>
  </svg>`,

  '/assets/placeholder_math22_sol.png': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500" style="background-color:%23f9fafb;font-family:sans-serif;color:%23111111;padding:40px;">
    <rect width="100%" height="100%" fill="%23f9fafb" stroke="%23e5e7eb" stroke-width="2"/>
    <text x="40" y="45" font-size="18" font-weight="bold" fill="%232563eb">[해설 및 모범 답안]</text>
    <text x="40" y="90" font-size="14" font-weight="bold" fill="%231f2937">1. f(x)의 개형 설정</text>
    <text x="40" y="115" font-size="13" fill="%234b5563">조건 (나)에 의해 f(x) = (x-alpha)^2 * (x-beta) 이거나 f(x) = (x-alpha) * (x-beta)^2 입니다.</text>
    <text x="40" y="140" font-size="13" fill="%234b5563">g(x)의 극대조건과 f(1) = 4를 연립하여 식을 세우면,</text>
    
    <rect x="40" y="170" width="520" height="70" fill="%23ffffff" stroke="%23d1d5db" rx="4" />
    <text x="60" y="210" font-size="15" font-family="monospace" font-weight="bold" fill="%23111111">f(x) = x(x-3)^2  (alpha = 3, beta = 0)</text>
    
    <text x="40" y="280" font-size="14" font-weight="bold" fill="%231f2937">2. 조건 검증</text>
    <text x="40" y="305" font-size="13" fill="%234b5563">- f(1) = 1 * (1-3)^2 = 4 (성립)</text>
    <text x="40" y="330" font-size="13" fill="%234b5563">- 극값 및 대칭축 이동 조건 성립 확인 완료</text>
    
    <text x="40" y="380" font-size="14" font-weight="bold" fill="%231f2937">3. 최종 구하고자 하는 값</text>
    <text x="40" y="410" font-size="16" font-weight="bold" fill="%23ef4444">f(5) = 5 * (5-3)^2 = 5 * 4 = 20</text>
    <text x="40" y="450" font-size="14" font-weight="bold" fill="%23111111">정답: 20</text>
  </svg>`,

  '/assets/placeholder_math29.png': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background-color:%23ffffff;font-family:sans-serif;color:%23111111;padding:40px;">
    <rect width="100%" height="100%" fill="%23ffffff" stroke="%23e5e7eb" stroke-width="2"/>
    <text x="40" y="50" font-size="18" font-weight="bold" fill="%231f2937">[문제 29] 그림과 같이 반지름의 길이가 2인 원에 외접하는</text>
    <text x="40" y="80" font-size="18" font-weight="bold" fill="%231f2937">정삼각형 ABC에서 색칠된 무한급수 영역의 합 S를 구하시오.</text>
    <circle cx="300" cy="240" r="80" fill="none" stroke="%23111111" stroke-width="1.5"/>
    <polygon points="300,101 161,341 439,341" fill="none" stroke="%23111111" stroke-width="2"/>
    <polygon points="300,101 240,205 360,205" fill="%23bfdbfe" stroke="%232563eb" stroke-width="1" opacity="0.6"/>
    <text x="300" y="90" font-size="12" text-anchor="middle" fill="%23111111">A</text>
    <text x="150" y="355" font-size="12" fill="%23111111">B</text>
    <text x="445" y="355" font-size="12" fill="%23111111">C</text>
  </svg>`,

  '/assets/placeholder_math29_sol.png': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background-color:%23f9fafb;font-family:sans-serif;color:%23111111;padding:40px;">
    <rect width="100%" height="100%" fill="%23f9fafb" stroke="%23e5e7eb" stroke-width="2"/>
    <text x="40" y="45" font-size="18" font-weight="bold" fill="%232563eb">[해설 및 모범 답안]</text>
    <text x="40" y="90" font-size="14" font-weight="bold" fill="%231f2937">1. 첫째항 S1 구하기</text>
    <text x="40" y="115" font-size="13" fill="%234b5563">정삼각형의 한 변의 길이는 4*sqrt(3) 이고,</text>
    <text x="40" y="135" font-size="13" fill="%234b5563">첫번째 색칠된 정삼각형의 넓이는 S1 = sqrt(3) 입니다.</text>
    <text x="40" y="170" font-size="14" font-weight="bold" fill="%231f2937">2. 공비 r 구하기</text>
    <text x="40" y="195" font-size="13" fill="%234b5563">닮음비는 1/2 이므로, 넓이비(공비 r)는 1/4 입니다.</text>
    <text x="40" y="240" font-size="14" font-weight="bold" fill="%231f2937">3. 무한등비급수 합 공식 대입</text>
    <text x="40" y="270" font-size="16" font-weight="bold" fill="%23ef4444">S = S1 / (1 - r) = sqrt(3) / (1 - 1/4) = 4*sqrt(3) / 3</text>
    <text x="40" y="320" font-size="15" font-weight="bold" fill="%23111111">정답: 4√3 / 3</text>
  </svg>`,

  '/assets/placeholder_eng3.png': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background-color:%23ffffff;font-family:sans-serif;color:%23111111;padding:40px;">
    <rect width="100%" height="100%" fill="%23ffffff" stroke="%23e5e7eb" stroke-width="2"/>
    <text x="40" y="50" font-size="18" font-weight="bold" fill="%231f2937">[영어 어휘 빈칸]</text>
    <text x="40" y="90" font-size="14" fill="%234b5563">Choose the most appropriate word for the blank:</text>
    <text x="40" y="140" font-size="15" fill="%23111111">The qualities of great leadership are not ________ to some individuals</text>
    <text x="40" y="165" font-size="15" fill="%23111111">by birth; rather, they are developed through continuous learning,</text>
    <text x="40" y="190" font-size="15" fill="%23111111">discipline, and reflective experience in real-world challenges.</text>
    <text x="40" y="240" font-size="14" fill="%231f2937">① inherent (내재적인, 타고난)</text>
    <text x="40" y="270" font-size="14" fill="%231f2937">② coherent (일관성 있는)</text>
    <text x="40" y="300" font-size="14" fill="%231f2937">③ ephemeral (일시적인)</text>
    <text x="40" y="330" font-size="14" fill="%231f2937">④ transparent (투명한)</text>
  </svg>`,

  '/assets/placeholder_eng3_sol.png': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background-color:%23f9fafb;font-family:sans-serif;color:%23111111;padding:40px;">
    <rect width="100%" height="100%" fill="%23f9fafb" stroke="%23e5e7eb" stroke-width="2"/>
    <text x="40" y="45" font-size="18" font-weight="bold" fill="%232563eb">[해설 및 모범 답안]</text>
    <text x="40" y="90" font-size="14" font-weight="bold" fill="%231f2937">어휘 및 문맥 해석:</text>
    <text x="40" y="120" font-size="14" fill="%234b5563">"훌륭한 리더십의 자질은 태어날 때부터 일부 개인에게 내재하는(inherent)</text>
    <text x="40" y="145" font-size="14" fill="%234b5563">것이 아니라, 지속적인 학습과 훈련을 통해 길러지는 것이다."</text>
    
    <text x="40" y="200" font-size="14" font-weight="bold" fill="%231f2937">핵심 단어 비교:</text>
    <text x="40" y="230" font-size="13" fill="%234b5563">- inherent: 타고난, 고유의, 내재하는 (정답)</text>
    <text x="40" y="255" font-size="13" fill="%234b5563">- coherent: 조리 있는, 일관성 있는</text>
    
    <text x="40" y="310" font-size="16" font-weight="bold" fill="%23ef4444">정답: ① inherent</text>
  </svg>`
};

export function getProblemImageSrc(url: string): string {
  if (placeholderImages[url]) {
    return placeholderImages[url];
  }
  return url;
}
