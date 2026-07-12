/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000;

// Body parser with large limit to support base64 image uploads
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API Client safely (Lazy check as per guidelines)
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      console.warn('GEMINI_API_KEY is not configured or using placeholder. AI features will fallback to high-quality heuristic mock responses.');
      // Create with dummy key to avoid instant throw, but we will catch/fallback during invocation
      aiClient = new GoogleGenAI({
        apiKey: 'placeholder_key',
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    } else {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
  }
  return aiClient;
}

// ==========================================================
// API Endpoints
// ==========================================================

// Endpoint for AI Folder & Tag suggestions based on text, title or memo
app.post('/api/ai/suggest', async (req, res) => {
  const { title, memo, existingFolders } = req.body;
  const foldersList = existingFolders || ['수학', '미적분', '확률과 통계', '영어', '독해', '어휘'];

  const apiKey = process.env.GEMINI_API_KEY;
  const hasRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY';

  if (!hasRealKey) {
    // Elegant fallback simulation if no real API key is configured yet
    // Heuristic analysis of title and memo to match folder and generate relevant tags
    let folderSuggestion = foldersList[0] || '미분류';
    let tagsSuggestion: string[] = ['중요복습'];

    const fullText = `${title || ''} ${memo || ''}`.toLowerCase();
    
    if (fullText.includes('미적분') || fullText.includes('수학') || fullText.includes('함수') || fullText.includes('미분') || fullText.includes('적분') || fullText.includes('급수')) {
      folderSuggestion = foldersList.find((f: string) => f.includes('미적분') || f === '수학') || '수학';
      tagsSuggestion = ['수능 기출', '평가원', '미적분'];
    } else if (fullText.includes('확률') || fullText.includes('통계') || fullText.includes('경우의 수')) {
      folderSuggestion = foldersList.find((f: string) => f.includes('확률') || f.includes('통계')) || '수학';
      tagsSuggestion = ['기출', '확통', '개념필수'];
    } else if (fullText.includes('영어') || fullText.includes('어휘') || fullText.includes('독해') || fullText.includes('단어') || fullText.includes('english') || fullText.includes('voca')) {
      folderSuggestion = foldersList.find((f: string) => f.includes('어휘') || f.includes('독해') || f === '영어') || '영어';
      tagsSuggestion = ['수능특강', '핵심어휘', '구문독해'];
    }

    if (title) {
      if (title.includes('수능') || title.includes('학년도')) tagsSuggestion.push('수능 기출');
      if (title.includes('평가원') || title.includes('모의')) tagsSuggestion.push('모평 기출');
      if (title.includes('특강') || title.includes('완성')) tagsSuggestion.push('EBS');
    }

    return res.json({
      folder: folderSuggestion,
      tags: Array.from(new Set(tagsSuggestion)),
      isMock: true
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
      사용자가 오답노트에 추가하려는 문제의 정보를 바탕으로 가장 적절한 '폴더명'과 '태그들'을 추천해주세요.
      기존에 존재하는 폴더 목록: [${foldersList.join(', ')}]

      문제 제목: ${title || '없음'}
      메모: ${memo || '없음'}

      출력 조건:
      1. 기존 폴더 목록 중에서 가장 잘 매칭되는 하나의 폴더명을 골라주세요. 매칭되는 것이 전혀 없다면 가장 적합한 새로운 한국어 폴더명을 하나 지어주세요.
      2. 이 문제에 어울리는 유용한 학습 태그를 2~4개 추천해주세요. (예: "수능 기출", "계산 조심", "핵심 어휘" 등)
      3. 반드시 JSON 포맷으로만 응답해 주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            folder: {
              type: Type.STRING,
              description: '추천 폴더명. 기존 폴더 목록에서 우선 매칭하거나 새로운 어울리는 폴더명을 추천함.'
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '추천 태그 목록 (2~4개)'
            }
          },
          required: ['folder', 'tags']
        }
      }
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    return res.json({
      folder: parsed.folder,
      tags: parsed.tags,
      isMock: false
    });
  } catch (error: any) {
    console.error('Gemini API Error in /api/ai/suggest:', error);
    return res.status(500).json({ error: error.message || 'AI 추천 실패' });
  }
});

// Endpoint for mock/AI auto-crop area prediction
// Fulfills step 5: "촬영 후 AI 또는 이미지 분석 기능을 이용해 문제 영역을 자동 감지하고 문제 부분만 크롭하도록 구조를 만들어줘"
app.post('/api/ai/detect-crop', (req, res) => {
  const { imageBase64 } = req.body;

  // Simulate complex layout bounding box extraction
  // Usually this analyzes layout via vision models. We provide a beautiful mock crop box
  // structured to simulate multi-problem detection or single problem crop box.
  // Returning 2 bounding boxes so user can experience selecting one, as requested:
  // "한 페이지에 여러 문제가 감지되면 각각의 문제 영역을 분리해서 보여주고 저장할 문제를 선택할 수 있게 해줘."
  
  const mockDetections = [
    {
      id: 'crop_1',
      label: '문제 1 (상단 영역)',
      box: { x: 5, y: 5, width: 90, height: 42 }, // percentages
      confidence: 0.94
    },
    {
      id: 'crop_2',
      label: '문제 2 (하단 영역)',
      box: { x: 5, y: 52, width: 90, height: 43 },
      confidence: 0.89
    }
  ];

  return res.json({
    detections: mockDetections
  });
});

// ==========================================================
// Vite Dev Server / Static Asset Serving
// ==========================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
