import os
import json
from deep_translator import GoogleTranslator

LOCALES_DIR = './_locales'

# 크롬 폴더명과 구글 번역기 코드가 다를 경우 매핑
# 여기에 문제가 발생한 코드들을 추가했습니다.
LANG_MAP = {
    'fil': 'tl',      # Filipino -> Tagalog
    'he': 'iw',       # Hebrew (구글 엔진에 따라 he 대신 iw 사용 가능성)
    'zh_CN': 'zh-CN', # Chinese Simplified
    'zh_TW': 'zh-TW', # Chinese Traditional
}

def get_google_lang_code(folder_name):
    # 매핑 테이블에 있으면 해당 코드를 반환, 없으면 앞 2글자만 사용
    if folder_name in LANG_MAP:
        return LANG_MAP[folder_name]
    return folder_name.split('_')[0]

def update_messages_json(key, ko_text, description=""):
    for lang_code in os.listdir(LOCALES_DIR):
        folder_path = os.path.join(LOCALES_DIR, lang_code)
        
        if not os.path.isdir(folder_path):
            continue
            
        json_path = os.path.join(folder_path, 'messages.json')
        
        # JSON 로드
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = {}
        else:
            data = {}

        # 번역 처리
        target_lang = get_google_lang_code(lang_code)
        
        try:
            # 한국어(ko)에서 타겟 언어로 번역
            translated_text = GoogleTranslator(source='ko', target=target_lang).translate(ko_text)
            print(f"[{lang_code}] 번역 성공: {translated_text}")
        except Exception as e:
            print(f"[{lang_code}] 번역 실패: {e}")
            translated_text = ko_text # 실패 시 원문 유지

        data[key] = {
            "message": translated_text,
            "description": description
        }

        # 저장
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    print("=== Chrome Extension I18n Fixer ===")
    
    new_key = "OPEN_LOCATION" # input("추가할 KEY를 입력하세요 (예: TEXT_SEARCH): ").strip()
    new_ko_text = "위치 열기" # input("한글 텍스트를 입력하세요: ").strip()
    new_desc = ""; # input("설명(description)을 입력하세요 (생략 가능): ").strip()

    if new_key and new_ko_text:
        update_messages_json(new_key, new_ko_text, new_desc)
        print("\n모든 작업이 완료되었습니다!")