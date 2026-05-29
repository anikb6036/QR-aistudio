/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QRErrorCorrectionLevel = 'M' | 'L' | 'Q' | 'H';

export type QRPatternStyle = 'squares' | 'dots' | 'smooth' | 'extra-rounded';

export type QREyeStyle = 'square' | 'rounded' | 'circle' | 'leaf';

export interface QRColorConfig {
  type: 'solid' | 'gradient';
  solidColor: string;
  gradientType: 'linear' | 'radial';
  gradientColor1: string;
  gradientColor2: string;
  gradientRotation: number; // in degrees for linear
}

export interface QRLogoConfig {
  src: string; // Base64 or object URL or pre-made logo
  scale: number; // 0.05 to 0.3
  padding: number; // border margin around logo
  backgroundColor: string; // solid bg color behind logo (helps transparent logos)
  shape: 'square' | 'circle' | 'rounded';
}

export interface QRDesignConfig {
  id: string;
  name: string;
  patternStyle: QRPatternStyle;
  eyeStyleOuter: QREyeStyle;
  eyeStyleInner: QREyeStyle;
  foreground: QRColorConfig;
  background: string; // Hex, rgba, or 'transparent'
  errorCorrection: QRErrorCorrectionLevel;
  logo: QRLogoConfig;
  margin: number; // Quiet zone size (blocks)
  label?: {
    text: string;
    fontSize: number;
    color: string;
    fontFamily: string;
  };
}

export interface BatchQRItem {
  id: string;
  content: string; // payload for QR code
  filename: string; // output file name
  label?: string; // custom text below this specific QR code
  isSelected: boolean;
  isGenerating?: boolean;
  status?: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

export interface StorageTemplate {
  id: string;
  name: string;
  config: QRDesignConfig;
  createdAt: number;
}

export interface CloudBackupPayload {
  userId: string;
  templates: StorageTemplate[];
  batchItems: BatchQRItem[];
  updatedAt: number;
}
