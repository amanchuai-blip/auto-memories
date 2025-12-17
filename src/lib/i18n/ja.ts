// Japanese translations for Auto Memories

export const ja = {
    // App
    app: {
        name: 'Auto Memories',
        tagline: '旅の写真をシネマチックな思い出に',
        recordingTip: '💡 スクリーンレコーディングで動画として保存できます',
    },

    // Home page
    home: {
        createNew: '新しい思い出を作る',
        createNewDesc: '旅の写真をアップロードしてエンドロールを生成',
        pastMemories: '過去の思い出',
        tripCount: '{count}件の旅',
        noTrips: 'まだ思い出がありません',
        noTripsDesc: '最初の旅の思い出を作成しましょう',
    },

    // Create page
    create: {
        title: '新しい思い出を作る',
        subtitle: '旅の写真をアップロードしてシネマチックなリキャップを生成',
        back: '戻る',
        tripName: '旅行名',
        tripNamePlaceholder: '例: 夏の京都旅行',
        dropzone: {
            title: '旅の写真をドラッグ＆ドロップ',
            titleActive: 'ここにドロップ',
            subtitle: 'またはクリックして選択 • JPEG, PNG, HEIC対応',
            processing: '写真を処理中...',
            progress: '{current} / {total} - {filename}',
        },
        photosReady: '{count}枚の写真が準備完了',
        clearAll: 'すべてクリア',
        stats: {
            photos: '写真',
            withGps: 'GPS付き',
            achievements: '実績',
        },
        createButton: '思い出を作成',
        creating: '作成中...',
        errors: {
            noPhotos: '写真を処理できませんでした。別の画像をお試しください。',
            noExif: '日付情報のある写真が見つかりません。EXIF情報付きの写真をご使用ください。',
            rejected: '一部のファイルが拒否されました。JPEG、PNG、HEIC形式をご使用ください。',
            saveFailed: '保存に失敗しました。もう一度お試しください。',
        },
    },

    // Play page
    play: {
        back: '戻る',
        playButton: '再生',
        howToSave: '動画として保存する方法',
        stats: {
            photos: '写真',
            distance: 'km',
            duration: '所要時間',
        },
        achievementsEarned: '獲得した実績',
        endroll: {
            theEnd: '終わり',
            backToHome: 'ホームに戻る',
            achievementUnlocked: '実績解除',
            createdWith: 'Auto Memoriesで作成',
        },
        controls: {
            play: '再生',
            pause: '一時停止',
            skip: 'スキップ',
            mute: 'ミュート',
            unmute: 'ミュート解除',
            exit: '終了',
        },
    },

    // Recording guide
    recording: {
        title: '思い出を動画で保存する方法',
        subtitle: 'お使いのデバイスのスクリーンレコーディング機能を使って旅のリキャップをキャプチャ',
        tip: 'スクリーンレコーディングは、シネマチックな地図アニメーション、写真の切り替え、音楽など、画面に映るものすべてを記録します。',
        gotIt: 'わかりました！',
        platforms: {
            ios: {
                name: 'iOS / iPadOS',
                steps: [
                    'コントロールセンターを開く（右上から下にスワイプ）',
                    '画面収録ボタン（丸いアイコン）をタップ',
                    '3秒のカウントダウンを待つ',
                    '思い出を再生',
                    'コントロールセンターまたは赤いステータスバーから停止',
                ],
            },
            android: {
                name: 'Android',
                steps: [
                    'クイック設定を開く（下にスワイプ）',
                    '「スクリーンレコーダー」を探してタップ',
                    '音声設定で「メディア音声」を選択',
                    '開始をタップ',
                    '思い出を再生',
                    '通知またはフローティングバブルから停止',
                ],
            },
            windows: {
                name: 'Windows',
                steps: [
                    'Win + G でゲームバーを開く',
                    '録画ボタンをクリックまたは Win + Alt + R',
                    '思い出を再生',
                    'Win + Alt + R で録画停止',
                ],
            },
            macos: {
                name: 'macOS',
                steps: [
                    'Cmd + Shift + 5 を押す',
                    '「画面全体を収録」をクリックまたは範囲を選択',
                    '収録をクリック',
                    '思い出を再生',
                    'メニューバーの停止をクリック',
                ],
            },
        },
    },

    // Trip card
    trip: {
        delete: '削除',
        deleteConfirm: 'この旅を削除しますか？この操作は取り消せません。',
    },

    // Time formatting
    time: {
        hours: '{h}時間',
        minutes: '{m}分',
        hoursMinutes: '{h}時間{m}分',
    },

    // Share
    share: {
        title: '思い出を共有',
        shareButton: '共有',
        copied: 'クリップボードにコピーしました',
        shareText: '{name} - Auto Memoriesで作成した旅の思い出',
    },

    // Achievements
    achievements: {
        // Speed & Movement
        teleporter: { title: 'テレポーター', desc: '驚異的なスピードで移動した' },
        slowpoke: { title: 'のんびり屋', desc: 'ゆっくり時間をかけた' },
        marathon_runner: { title: 'マラソンランナー', desc: 'マラソン距離を踏破' },
        jet_setter: { title: 'ジェットセッター', desc: '空を駆け抜けた' },

        // Time-based
        early_bird: { title: '早起き鳥', desc: '朝の光をキャッチ' },
        night_owl: { title: '夜更かしフクロウ', desc: '深夜を探索' },
        golden_hour: { title: 'ゴールデンアワー', desc: 'マジックアワーを撮影' },
        midnight_explorer: { title: '真夜中の探検家', desc: '真夜中に活動' },
        weekend_warrior: { title: '週末戦士', desc: '休日を最大限に活用' },
        long_weekend: { title: 'ロングウィークエンド', desc: '冒険を延長' },
        week_traveler: { title: '一週間の旅人', desc: '丸一週間の探索' },
        month_adventurer: { title: '月間冒険者', desc: '一ヶ月の大冒険' },

        // Photo behavior
        machine_gun: { title: 'マシンガン', desc: '連射撮影' },
        minimalist: { title: 'ミニマリスト', desc: '質を重視' },
        photographer: { title: 'フォトグラファー', desc: '100枚以上の瞬間を記録' },
        paparazzi: { title: 'パパラッチ', desc: 'すべてを記録' },
        one_shot: { title: 'ワンショット', desc: '一枚の写真、一つの思い出' },
        time_lapse_master: { title: 'タイムラプスマスター', desc: '完璧なインターバル' },

        // Location & Geography
        mountain_hiker: { title: '山岳ハイカー', desc: '高みを征服' },
        sea_level: { title: 'ビーチラバー', desc: '海辺に滞在' },
        altitude_master: { title: '高度マスター', desc: '天空へ到達' },
        cafe_dweller: { title: 'カフェの住人', desc: '最高の場所を発見' },
        nomad: { title: 'ノマド', desc: '止まることなく移動' },
        border_crosser: { title: '国境越え', desc: '新たな領域へ' },
        circle_back: { title: '一周', desc: '始まりの場所へ帰還' },
        straight_line: { title: '直進', desc: '目的を持って移動' },

        // Special conditions
        weather_master: { title: 'ウェザーマスター', desc: 'あらゆる天候を体験' },
        completionist: { title: 'コンプリーター', desc: '実績ハンター' },
        first_timer: { title: '初めての旅', desc: 'Auto Memoriesへようこそ' },
        anniversary: { title: '記念日', desc: '特別な日が戻ってきた' },
        lucky_seven: { title: 'ラッキーセブン', desc: '魔法の数字' },
        round_number: { title: 'キリ番', desc: '完璧なバランス' },
        symmetric: { title: 'シンメトリー', desc: '鏡よ鏡...' },
        fibonacci: { title: 'フィボナッチ', desc: '自然の法則' },
        prime_time: { title: 'プライムタイム', desc: '数学的に特別' },
        perfect_timing: { title: 'パーフェクトタイミング', desc: 'ちょうど00秒に撮影' },
        triple_digit: { title: 'トリプルショット', desc: 'バーストモード発動' },
    },

    // Rarity
    rarity: {
        common: 'コモン',
        uncommon: 'アンコモン',
        rare: 'レア',
        epic: 'エピック',
        legendary: 'レジェンダリー',
    },
};

export type TranslationKey = keyof typeof ja;
