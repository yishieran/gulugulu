// ==UserScript==
// @name         随机人设
// @author       九月
// @version      1.2.0
// @description  性格+性别+发色+瞳色
// @license      MIT
// @sealVersion  1.5.1-dev
// ==/UserScript==

let ext = seal.ext.find('randomCard');
if (!ext) {
    ext = seal.ext.new('randomCard', '九月', '1.2.0');
    seal.ext.register(ext);
}

var characters = [
    "傲娇","傲沉","病娇","高冷","郁娇","懒散","三无","无口","文静","率真",
    "暴躁","高傲","笨蛋","天然呆","天然黑","认真系","电波系","调皮","工口",
    "毒舌","元气","狂气","弱气","偏执","爱哭","迟钝","地雷系","自来熟","怕生",
    "滥情","孩子气","任性","胆小","欺软怕硬","八卦","耿直","少女心","单纯",
    "腹黑","可靠","白切黑","黑切白","温柔","玻璃心","老好人","小恶魔系",
    "清楚系","记仇","常识人","闷骚","恋爱脑","自卑","神经质","天使系",
    "高攻低防","妈妈感","阴沉","外冷内热","外热内冷"
];
var genders = ["男子", "女子"];

// ========== 性格：对立组 ==========
// [A, B]：A 里的任意一个和 B 里的任意一个互相冲突，抽到一边就不会再抽到另一边。
// 只写真正矛盾的；像 温柔+腹黑 这种有反差的组合不拦，正好用来丰富性格。
var opposites = [
    [["外冷内热"], ["外热内冷"]],
    [["白切黑"], ["黑切白"]],
    [["单纯"], ["腹黑", "白切黑", "黑切白", "天然黑", "小恶魔系"]],
    [["高冷", "怕生", "阴沉", "三无", "无口", "自卑"], ["自来熟", "元气", "八卦"]],
    [["懒散"], ["认真系", "元气"]],
    [["迟钝"], ["神经质", "玻璃心"]],
    [["老好人"], ["欺软怕硬", "记仇", "暴躁"]],
    [["天使系", "妈妈感"], ["欺软怕硬"]],
    [["胆小", "弱气", "自卑"], ["狂气", "高傲"]],
    [["常识人"], ["电波系", "狂气"]],
    [["率真", "耿直"], ["傲娇", "闷骚", "腹黑"]],
    [["孩子气"], ["妈妈感"]],
    [["文静"], ["暴躁", "调皮"]],
    [["笨蛋"], ["腹黑"]]
];

// 把对立组展开成 { 性格: [冲突的性格...] }
var conflicts = {};
opposites.forEach(function (pair) {
    pair[0].forEach(function (a) {
        pair[1].forEach(function (b) {
            (conflicts[a] = conflicts[a] || []).push(b);
            (conflicts[b] = conflicts[b] || []).push(a);
        });
    });
});

function getTwoChars() {
    var pool = characters.slice();
    var first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    var bad = conflicts[first] || [];
    pool = pool.filter(function (c) { return bad.indexOf(c) < 0; });
    var second = pool[Math.floor(Math.random() * pool.length)];
    return first + " / " + second;
}

// ========== 颜色：二次元常用色表 ==========
// [名称, 色相H, 饱和度S, 明度V, 发色权重, 瞳色权重]
// H/S/V 都是 [最小, 最大] 区间；H 的最小值大于最大值表示跨过 0°（如红色 [350,10]）
// 权重是相对值，越大越常出现。
// 有彩色的颜色都保持 S≥20、V≥30（再低就发灰/发黑，作为固有色不常用）；
// 黑、白、银灰是单独写的无彩色，用自己的区间。
var palette = [
    ["黑色",   [0, 359],   [0, 25],  [30, 42],  24, 8],
    ["白色",   [0, 359],   [0, 12],  [92, 100],  4, 1],
    ["银灰色", [0, 359],   [0, 15],  [55, 82],   4, 4],
    ["棕色",   [15, 35],   [40, 75], [30, 60],  16, 16],
    ["金色",   [38, 52],   [35, 75], [75, 100], 10, 10],
    ["黄色",   [52, 68],   [40, 75], [75, 100],  1, 3],
    ["橙色",   [18, 36],   [55, 85], [70, 95],   2, 5],
    ["红色",   [350, 10],  [55, 90], [55, 85],   6, 10],
    ["粉色",   [330, 355], [20, 50], [75, 100],  9, 4],
    ["紫红色", [305, 330], [40, 80], [55, 85],   2, 3],
    ["紫色",   [265, 300], [35, 75], [50, 90],   7, 11],
    ["蓝紫色", [235, 265], [35, 75], [55, 90],   3, 5],
    ["蓝色",   [195, 235], [35, 80], [55, 90],   8, 14],
    ["青色",   [165, 195], [35, 75], [60, 90],   2, 7],
    ["绿色",   [95, 150],  [30, 70], [40, 80],   3, 9],
    ["黄绿色", [70, 95],   [35, 70], [60, 90],   1, 2]
];

var SV_HIGH = 80; // S 和 V 不能同时超过它，否则饱和度太高、太刺眼

function rand(lo, hi) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randHue(range) {
    var lo = range[0], hi = range[1];
    if (lo > hi) hi += 360;
    return rand(lo, hi) % 360;
}

// kind: "hair" 用发色权重，"eye" 用瞳色权重
function getColor(kind) {
    var w = kind === "eye" ? 5 : 4;
    var total = 0;
    palette.forEach(function (c) { total += c[w]; });

    var r = Math.random() * total;
    var pick = palette[palette.length - 1];
    for (var i = 0; i < palette.length; i++) {
        r -= palette[i][w];
        if (r < 0) { pick = palette[i]; break; }
    }

    var h = randHue(pick[1]);
    var s = rand(pick[2][0], pick[2][1]);
    var v = rand(pick[3][0], pick[3][1]);
    if (s > SV_HIGH && v > SV_HIGH) {
        v = rand(pick[3][0], Math.max(pick[3][0], Math.min(pick[3][1], SV_HIGH)));
    }
    return { h: h, s: s, v: v, name: pick[0] };
}

var cmd = seal.ext.newCmdItemInfo();
cmd.name = "设定";
cmd.alias = ["人设"];

cmd.solve = function(ctx, msg, cmdArgs) {
    var chara = getTwoChars();
    var gender = genders[Math.floor(Math.random() * genders.length)];
    var hair = getColor("hair");
    var eye = getColor("eye");

    var result = "一个" + chara + "" + gender + "\n" +
        "发色：" + hair.name + " HSV(" + hair.h + "," + hair.s + "," + hair.v + ")\n" +
        "瞳色：" + eye.name + " HSV(" + eye.h + "," + eye.s + "," + eye.v + ")";

    seal.replyToSender(ctx, msg, result);
};

ext.cmdMap['设定'] = cmd;
