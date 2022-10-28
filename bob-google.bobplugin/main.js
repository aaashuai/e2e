/**
 * 由于各大服务商的语言代码都不大一样，
 * 所以我定义了一份 Bob 专用的语言代码，以便 Bob 主程序和插件之间互传语种。
 * Bob 语言代码列表 https://ripperhe.gitee.io/bob/#/plugin/addtion/language
 * 
 * 转换的代码建议以下面的方式实现，
 * `xxx` 代表服务商特有的语言代码，请替换为真实的，
 * 具体支持的语种数量请根据实际情况而定。
 * 
 * Bob 语言代码转服务商语言代码(以为 'zh-Hans' 为例): var lang = langMap.get('zh-Hans');
 * 服务商语言代码转 Bob 语言代码: var standardLang = langMapReverse.get('xxx');
 */

var items = [
    ['auto', 'auto'],
    ['zh-Hans', 'en'],
    ['zh-Hant', 'en'],
    ['en', 'en'],
];

var langMap = new Map(items);
var langMapReverse = new Map(items.map(([standardLang, lang]) => [lang, standardLang]));

function supportLanguages() {
    return items.map(([standardLang, lang]) => standardLang);
}

function translate(query, completion) {
    $log.info(query.text);
    if (query.text.indexOf(" ") != -1){
        completion({ 'error': { "type": "param", "message": "not support phrase or paragraph." } });
        return
    }
    let url = `https://api.dictionaryapi.dev/api/v2/entries/en/${query.text}`;
    $http.get({
        url: url,
        handler: function (resp) {
            var data = resp.data
            let word = data[0];
            $log.info(word);
            $log.info(JSON.stringify(word));
            if (typeof word == 'undefined') {
                completion({ 'error': { "type": "param", "message": data.title } });
                return
            }
            let phonetics = [];
            for (const p of word.phonetics) {
                //$log.info('phonetic');
                //$log.info(JSON.stringify(p));
                if ("text" in p && "audio" in p){
                    phonetics.push(
                        {
                            "type": "us",
                            "value": p.text,
                            "tts": {
                                "type": "url",
                                "value": p.audio,
                            }
                        }
                    );

                }
            }
            //$log.info('phonetics');
            //$log.info(JSON.stringify(phonetics));
            let parts = [];

            for (const mean of word.meanings) {
                const ex = mean.definitions[0];
                parts.push(
                    {
                        "part": mean.partOfSpeech,
                        "means": [ex.definition],
                    },
                    {
                        "part": `${mean.partOfSpeech}.e.g.`,
                        "means": [ex.example],
                    }
                );
            }

            //$log.info('parts');
            //$log.info(JSON.stringify(parts));


            let ret = {
                "from": query.from,
                "to": query.to,
                "fromParagraphs": [
                    query.text
                ],
                "toParagraphs": [
                    word.word

                ],
                "toDict": {
                    "word": word.word,
                    "phonetics": phonetics,
                    "parts": parts,
                    "exchanges": [],
                    "additions": []
                },
                "raw": {}
            };
            //$log.info('ret');
            //$log.info(JSON.stringify(ret));
            completion({ 'result': ret });
        }
    })

}
