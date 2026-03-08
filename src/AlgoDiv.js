// AlgoDiv.js --- 割り算アルゴリズム
// Author: katahiromz
// License: MIT
"use strict";
class AlgoDiv extends AlgoBase {
    // コンストラクタ
    constructor(canvas, textarea, end_fn = null) {
        super(canvas, textarea, end_fn);
        this.reset();
    }
    // 計算を行う
    doCalc(a, b, c, origin_iy = 0) {
        // 長除法で割り算を行う
        this.clearMapping();
        this.addCommand(['output', `これから ${a} ÷ ${b} を計算します。`]);
        // 数の情報を取得
        let a_info = getNumberInfo(a), b_info = getNumberInfo(b);
        // 小数点なし
        let a_digits = a_info.digits, b_digits = b_info.digits;
        // 小数点の位置
        let a_fracLen = a_info.frac_len, b_fracLen = b_info.frac_len;
        // 割られる数(A)と割る数(B)を元の値でそのまま配置する
        this.addCommand(['output', `わられる数 ${a} とわる数 ${b} を図のように書いてください。`]);
        // 被除数(A)を配置
        this.autoPutDigitsEx(a, 0, origin_iy + 1);
        // 除数(B)を配置
        this.autoPutDigitsEx(b, -a_digits.length - 1, origin_iy + 1);
        this.addCommand(['step']);
        // 線を描く
        this.addCommand(['output', `図のように線を描いてください。`]);
        this.addCommand(['drawDivCurve', -a_digits.length - 1, origin_iy + 1]);
        this.addCommand(['drawLine', -a_digits.length - 0.7, origin_iy + 1, 0, origin_iy + 1]);
        // 除数に小数点がある場合の処理
        if (b_fracLen > 0) {
            this.addCommand(['output', `わる数に小数点がありますので、わられる数とわる数を ${ 10**b_fracLen } 倍して、わる数の小数点を消します。`]);
            // わる数の小数点を消す
            this.addCommand(['slashDot', -(a_digits.length + b_fracLen + 1), origin_iy + 1]);
            // わられる数の小数点を消す。わられる数に小数点がなかった場合は、小数点の位置を強調するために小数点を書いてから消すようにする
            if (a_fracLen == 0) {
                this.addCommand(['drawDot', -a_fracLen, origin_iy + 1]);
            }
            if (a_fracLen >= 0) {
                this.addCommand(['slashDot', -a_fracLen, origin_iy + 1]);
            }
            // 小数点以下の桁数により場合分け
            if (a_fracLen > b_fracLen) {
                // 小数点の位置をずらす
                this.addCommand(['drawDot', -(a_fracLen - b_fracLen), origin_iy + 1]);
            } else if (a_fracLen < b_fracLen) {
                // ゼロを追加
                for (let i = 0; i < (b_fracLen - a_fracLen); ++i) {
                    this.addCommand(['drawDigit', i, origin_iy + 1, '0', true]);
                }
            }
        }
        this.addCommand(['drawDigit', -a_fracLen, origin_iy, '8']);
        this.addCommand(['drawDot', -a_fracLen, origin_iy]);
    }
    // コマンドの構築
    buildCommands() {
        this.doCalc(this.a, this.b, this.c || '0');
    }
    testEntry(a, b, answer, c) {
        console.assert(typeof a === 'string');
        console.assert(typeof b === 'string');
        console.assert(typeof c === 'string');
        this.reset();
        this.set(a, b, c);
        while (this.nextCommand()) {
            ;
        }
        return this.answer === answer;
    }
    testEntryEx(a, b, answer, c = '0') {
        if (!this.testEntry(a, b, answer, c)) {
            console.log(a, b, c, answer, this.answer);
            return false;
        }
        return true;
    }
    // 単体テスト
    unitTest() {
        console.assert(this.testEntryEx('612', '3', '204'));
        console.assert(this.testEntryEx('100', '5', '20'));
        console.assert(this.testEntryEx('100', '20', '5'));
        console.assert(this.testEntryEx('100', '25', '4'));
        console.assert(this.testEntryEx('100', '4', '25'));
        console.assert(this.testEntryEx('10', '0.5', '20'));
        console.assert(this.testEntryEx('10', '2', '5'));
        console.assert(this.testEntryEx('10', '2.5', '4'));
        console.assert(this.testEntryEx('10', '0.4', '25'));
        console.assert(this.testEntryEx('10', '40', '0 … 10'));
        console.assert(this.testEntryEx('10', '40', '0.25', '2'));
        console.assert(this.testEntryEx('10', '40', '0.250', '3'));
        console.assert(this.testEntryEx('10', '40', '0.2 … 2', '1'));
        console.assert(this.testEntryEx('0.1', '0.4', '0.2 … 0.02', '1'));
        console.assert(this.testEntryEx('0.1', '2', '0.0500', '4'));
        console.assert(this.testEntryEx('999', '0.1', '9990', '0'));
        console.assert(this.testEntryEx('999', '0.1', '9990.00', '2'));
        console.assert(this.testEntryEx('99999999999999999999', '99999999999999999999', '1.0', '1'));
        console.assert(this.testEntryEx('99.9', '990', '0 … 99.9', '0'));
        console.assert(this.testEntryEx('123.55', '789', '0.1 … 44.65', '1'));
        console.assert(this.testEntryEx('12.345', '1', '12.34 … 0.005', '2'));
        console.assert(this.testEntryEx('12.355', '789', '0.0 … 12.355', '1'));
        console.assert(this.testEntryEx('12.355', '78', '0.1 … 4.555', '1'));
        console.assert(this.testEntryEx('12.355', '7', '1.7 … 0.455', '1'));
        console.assert(this.testEntryEx('12345', '67', '184.25 … 0.25', '2'));
        console.assert(this.testEntryEx('7.955', '7.89', '1.00 … 0.065', '2'));
        console.assert(this.testEntryEx('0.3', '0.25', '1 … 0.05'));
        console.assert(this.testEntryEx('1.3', '0.25', '5 … 0.05'));
        console.assert(this.testEntryEx('0.01', '0.1', '0 … 0.01'));
        console.assert(this.testEntryEx('0.25', '0.3', '0 … 0.25'));
        console.assert(this.testEntryEx('1', '0.3', '3.3 … 0.01', '1'));
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('63', '2', '31 … 1'));
        console.assert(this.testEntryEx('88', '4', '22'));
        console.assert(this.testEntryEx('95', '9', '10 … 5'));
        console.assert(this.testEntryEx('89', '4', '22 … 1'));
        console.assert(this.testEntryEx('38', '3', '12 … 2'));
        console.assert(this.testEntryEx('57', '5', '11 … 2'));
        console.assert(this.testEntryEx('89', '2', '44 … 1'));
        console.assert(this.testEntryEx('75', '7', '10 … 5'));
        console.assert(this.testEntryEx('43', '2', '21 … 1'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('21', '2', '10 … 1'));
        console.assert(this.testEntryEx('83', '2', '41 … 1'));
        console.assert(this.testEntryEx('67', '3', '22 … 1'));
        console.assert(this.testEntryEx('62', '6', '10 … 2'));
        console.assert(this.testEntryEx('87', '4', '21 … 3'));
        console.assert(this.testEntryEx('61', '2', '30 … 1'));
        console.assert(this.testEntryEx('85', '4', '21 … 1'));
        console.assert(this.testEntryEx('64', '6', '10 … 4'));
        console.assert(this.testEntryEx('68', '3', '22 … 2'));
        // 【ちびむすより引用】ここまで
        // 【ちびむすより引用】ここから
        console.assert(this.testEntryEx('168', '22', '7 … 14'));
        console.assert(this.testEntryEx('107', '32', '3 … 11'));
        console.assert(this.testEntryEx('286', '31', '9 … 7'));
        console.assert(this.testEntryEx('207', '44', '4 … 31'));
        console.assert(this.testEntryEx('183', '26', '7 … 1'));
        console.assert(this.testEntryEx('127', '23', '5 … 12'));
        console.assert(this.testEntryEx('567', '64', '8 … 55'));
        console.assert(this.testEntryEx('186', '34', '5 … 16'));
        console.assert(this.testEntryEx('386', '42', '9 … 8'));
        console.assert(this.testEntryEx('101', '18', '5 … 11'));
        console.assert(this.testEntryEx('163', '26', '6 … 7'));
        console.assert(this.testEntryEx('380', '85', '4 … 40'));
        // 【ちびむすより引用】ここまで
        this.reset();
    }
}