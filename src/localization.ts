/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';

export const translations = {
  en: {
    app_title: "SUDOKU GAZETTE",
    app_subtitle: "The Elite Multilingual Newspaper-Style Print & Lookup Platform",
    tagline: "ALL THE PUZZLES AND SOLUTIONS FIT TO PRINT • ESTABLISHED 2026",
    issue: "ISSUE No. 2103 - THURSDAY EDITION",
    difficulty: "Difficulty Level",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
    paper_size: "Paper Format",
    grids_per_page: "Sudoku Grids per Page",
    pages_to_generate: "Total Pages to Generate",
    generate_print: "Compile Sheets",
    print_pdf: "Print Worksheets (browser print)",
    puzzle_id: "Puzzle ID",
    scan_or_lookup: "Scan the QR code or search the Puzzle ID online to retrieve the verified solution.",
    search_placeholder: "Enter Puzzle ID (e.g., E1024)",
    search_button: "Find Solution",
    result_not_found: "Puzzle ID not found. Verify the ID and try again.",
    solution_title: "SUNDAY SOLUTION SHEET",
    interactive_editor: "Solving Workspace: Click empty cells to input answers. Green cells indicate correct inputs. Red indicators helper.",
    back_to_generator: "← Back Grid Compiler",
    solution_for: "Verified Solution for",
    load_error: "Unable to retrieve the data. Please check connection.",
    generating: "Meticulously crafting puzzle grids...",
    success_generated: "Worksheets successfully refreshed! Look down at the Press Preview below.",
    instructions_title: "RULES OF THE GAZETTE",
    newspaper_inst_1: "1. Fill every blank cell with a solitary digit from 1 to 9.",
    newspaper_inst_2: "2. Every rank (row), file (column), and 3x3 sub-grid must hold each digit precisely once without repetition.",
    newspaper_inst_3: "3. If stuck, scan the QR code alongside the grid or input the unique ID on our look-up portal.",
    reveal_solution: "Reveal Complete Solution",
    reset_board: "Clear Workspace",
    interactive_mode: "Interactive Solving Mode",
    showing_solution: "Displaying Official Solution",
    searching: "Searching the Archives...",
    scan_instruction: "SCAN ME FOR THE ANSWER",
    footer_text: "Printed on paper-grade digital stock. Crafted for daily exercise of the mind."
  },
  vi: {
    app_title: "SUDOKU THỜI BÁO",
    app_subtitle: "Nền tảng In & Tra cứu Lời giải Sudoku Đa ngôn ngữ Cổ điển",
    tagline: "MỌI CÂU ĐỐ VÀ LỜI GIẢI PHÙ HỢP ĐỀU ĐƯỢC THIẾT KẾ ĐỂ IN • THÀNH LẬP NĂM 2026",
    issue: "SỐ 2103 - SỐ TẠP CHÍ THỨ 8",
    difficulty: "Mức độ Thử thách",
    easy: "Dễ (Easy)",
    medium: "Trung bình (Medium)",
    hard: "Khó (Hard)",
    expert: "Chuyên gia (Expert)",
    paper_size: "Khổ Giấy In",
    grids_per_page: "Số Ô Đố trên mỗi Trang",
    pages_to_generate: "Tổng số Trang cần In",
    generate_print: "Chế bản Câu Đố",
    print_pdf: "In Trang Đề (Trình duyệt)",
    puzzle_id: "Mã Đề",
    scan_or_lookup: "Quét mã QR hoặc nhập Mã Đề trực tuyến để xem lời giải đã được xác thực.",
    search_placeholder: "Nhập Mã Đề (Ví dụ: E1024)",
    search_button: "Tìm Lời Giải",
    result_not_found: "Không tìm thấy Mã Đề này. Vui lòng kiểm tra lại.",
    solution_title: "BẢN QUY CHIẾU LỜI GIẢI",
    interactive_editor: "Giao diện Giải Đố: Nhấp vào ô trống để điền số. Ô màu xanh là đúng, màu đỏ cần kiểm tra lại.",
    back_to_generator: "← Quay lại Bộ Chế Bản",
    solution_for: "Lời giải Xác thực cho Đề",
    load_error: "Không thể kết nối với máy chủ cứu dữ liệu.",
    generating: "Đang tính toán các khung lưới Sudoku chuẩn...",
    success_generated: "Đã thiết lập trang in hành công! Hãy xem trước Bản in Thử nghiệm bên dưới.",
    instructions_title: "QUY CHẾ SỬ DỤNG",
    newspaper_inst_1: "1. Điền vào mỗi ô trống một chữ số duy nhất từ 1 đến 9.",
    newspaper_inst_2: "2. Mỗ hàng ngang, cột dọc, và phân vùng 3x3 phải có đầy đủ các chữ số từ 1 đến 9 không trùng lặp.",
    newspaper_inst_3: "3. Nếu gặp bế tắc, quét mã QR bên cạnh đề hoặc tra cứu mã đề trên trang web để xem đáp án.",
    reveal_solution: "Hiện Toàn bộ Đáp án",
    reset_board: "Xoá Trạng thái Chơi",
    interactive_mode: "Chế độ Giải Đố Tương tác",
    showing_solution: "Đang hiển thị Lời giải Chính thức",
    searching: "Đang tìm kiếm trong kho báo chí...",
    scan_instruction: "QUÉT TÔI ĐỂ XEM LỜI GIẢI",
    footer_text: "In trên chất liệu giấy báo điện tử chuyên dụng. Dành cho rèn luyện trí lực mỗi ngày."
  }
};

type TContext = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
};

export const TranslationContext = createContext<TContext | undefined>(undefined);

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
