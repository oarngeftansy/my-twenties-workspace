import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'我的20代生活 · 项目工作台',description:'游戏开发专用进度、任务、灵感、机制、GDD 与原始资料。'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
