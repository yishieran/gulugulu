// ==UserScript==
// @name         随机人设
// @author       九月
// @version      1.2.0
// @description  性格+性别+发色+瞳色
// @license      MIT
// @sealVersion  1.5.1-dev
// @homepageURL  https://github.com/yishieran
// ==/UserScript==

let ext = seal.ext.find('randomCard');
if (!ext) {
    ext = seal.ext.new('randomCard', '九月', '1.4.0');
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
// [A, B]：A 里的任意一个和 B 里的任意一个互相冲突，只抽取其一。
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
// 权重是相对值，越大越常出现
// 有彩色的颜色都保持 S≥20、V≥30，过低偏黑/偏灰
// 黑、白、银灰非彩色，独立区间
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

var SV_HIGH = 80; // S 和 V 同时超过则饱和度太高

function rand(lo, hi) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randHue(range) {
    var lo = range[0], hi = range[1];
    if (lo > hi) hi += 360;
    return rand(lo, hi) % 360;
}

// kind: "hair" 用发色权重，"eye" 用瞳色权重
function pickEntry(kind) {
    var w = kind === "eye" ? 5 : 4;
    var total = 0;
    palette.forEach(function (c) { total += c[w]; });

    var r = Math.random() * total;
    for (var i = 0; i < palette.length; i++) {
        r -= palette[i][w];
        if (r < 0) return palette[i];
    }
    return palette[palette.length - 1];
}

function makeColor(pick) {
    var h = randHue(pick[1]);
    var s = rand(pick[2][0], pick[2][1]);
    var v = rand(pick[3][0], pick[3][1]);
    if (s > SV_HIGH && v > SV_HIGH) {
        v = rand(pick[3][0], Math.max(pick[3][0], Math.min(pick[3][1], SV_HIGH)));
    }
    // neutral：黑/白/银灰 无彩色
    return { h: h, s: s, v: v, name: pick[0], neutral: pick[2][1] <= 25 };
}

function getColor(kind) {
    return makeColor(pickEntry(kind));
}

function colorByName(name) {
    for (var i = 0; i < palette.length; i++) {
        if (palette[i][0] === name) return makeColor(palette[i]);
    }
}

function hueDiff(a, b) {
    var d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

// 渐变：发根 a → 发尾 b
// 不能两个都是无彩色；其中一个是无彩色（如 紫→白），或者两个色相相近（≤70°，如 粉→紫）
function gradientHair(a) {
    for (var i = 0; i < 30; i++) {
        var b = getColor("hair");
        if (b.name === a.name || (a.neutral && b.neutral)) continue;
        if (a.neutral || b.neutral || hueDiff(a.h, b.h) <= 70) {
            return { type: "渐变", a: a, b: b };
        }
    }
    return { type: "渐变", a: a.neutral ? colorByName("蓝色") : a, b: colorByName("白色") };
}

// 阴阳头：左右两边不同色
// 有彩色配无彩色，或色相相差≥100°，或明度相差≥35
function splitHair(first) {
    var a, b;
    if (Math.random() < SPLIT_CLASSIC) {
        a = colorByName("黑色");
        b = colorByName("白色");
    } else {
        a = first;
        for (var i = 0; i < 30; i++) {
            var c = getColor("hair");
            if (c.name === a.name || (a.neutral && c.neutral)) continue;
            if (a.neutral !== c.neutral || hueDiff(a.h, c.h) >= 100 || Math.abs(a.v - c.v) >= 35) {
                b = c;
                break;
            }
        }
        if (!b) {
            a = colorByName("黑色");
            b = colorByName("白色");
        }
    }
    if (Math.random() < 0.5) { var t = a; a = b; b = t; } // 随机决定谁在左边
    return { type: "阴阳头", a: a, b: b };
}

// force：指定类型（"渐变" / "阴阳头"），不指定就按概率随机
function getHair(force) {
    var r = Math.random();
    var a = getColor("hair");
    if (force === "阴阳头" || (!force && r < SPLIT_RATE)) return splitHair(a);
    if (force === "渐变" || (!force && r < SPLIT_RATE + GRADIENT_RATE)) return gradientHair(a);
    return { type: "单色", a: a };
}

function showColor(c) {
    return "HSV(" + c.h + "," + c.s + "," + c.v + ")";
}

function showHair(hair) {
    var a = hair.a, b = hair.b;
    if (hair.type === "渐变") {
        return "发色：渐变 " + a.name + "→" + b.name + "\n" +
            "上 " + showColor(a) + "\n下 " + showColor(b);
    }
    if (hair.type === "阴阳头") {
        return "发色：阴阳头 左" + a.name + " 右" + b.name + "\n" +
            "左 " + showColor(a) + "\n右 " + showColor(b);
    }
    return "发色：" + a.name + " " + showColor(a);
}

// 异瞳：左右眼不同色
// 两个颜色不同、不能都是无彩色；要有对比，有彩色配无彩色，或色相相差≥60°
function heteroEyes() {
    var a = getColor("eye"), b;
    for (var i = 0; i < 30; i++) {
        var c = getColor("eye");
        if (c.name === a.name || (a.neutral && c.neutral)) continue;
        if (a.neutral !== c.neutral || hueDiff(a.h, c.h) >= 60) { b = c; break; }
    }
    if (!b) { a = colorByName("蓝色"); b = colorByName("金色"); }
    if (Math.random() < 0.5) { var t = a; a = b; b = t; } // 随机决定谁在左眼
    return { type: "异瞳", a: a, b: b };
}

// force 为 "异瞳" 时一定出异瞳，不指定就按概率随机
function getEyes(force) {
    if (force === "异瞳" || (!force && Math.random() < HETERO_RATE)) return heteroEyes();
    return { type: "单色", a: getColor("eye") };
}

function showEyes(eyes) {
    var a = eyes.a, b = eyes.b;
    if (eyes.type === "异瞳") {
        return "瞳色：异瞳 左" + a.name + " 右" + b.name + "\n" +
            "左 " + showColor(a) + "\n右 " + showColor(b);
    }
    return "瞳色：" + a.name + " " + showColor(a);
}

var cmd = seal.ext.newCmdItemInfo();
cmd.name = "设定";
cmd.alias = ["人设"];

// 用法：.设定  随机；.设定 渐变 / .设定 阴阳头 / .设定 异瞳  指定对应的类型
cmd.solve = function(ctx, msg, cmdArgs) {
    var arg = (typeof cmdArgs.getArgN === "function") ? cmdArgs.getArgN(1) : "";
    var force = arg === "渐变" ? "渐变" : (arg === "阴阳" || arg === "阴阳头") ? "阴阳头" : "";
    var forceEye = arg === "异瞳" ? "异瞳" : "";

    var chara = getTwoChars();
    var gender = genders[Math.floor(Math.random() * genders.length)];
    var hair = getHair(force);
    var eyes = getEyes(forceEye);

    var result = "一个" + chara + "" + gender + "\n" +
        showHair(hair) + "\n" +
        showEyes(eyes);

    seal.replyToSender(ctx, msg, result);
};

ext.cmdMap['设定'] = cmd;
