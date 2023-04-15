"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mathjs_1 = require("mathjs");
var A = [[]];
var b = [];
var c = [];
var B = [];
var N = [];
var artificial = [];
var signs = [];
var unrestricted = [];
function simplex() {
    var count = 0;
    // handling unrestricted variables.
    unrestricted.forEach(function (i) {
        A = A.map(function (row) {
            row.splice(i + 1 + count, 0, "-".concat(row[i + count]));
            return row;
        });
        count++;
    });
    var total_variables = A[0].length;
    // pushing all non basic variable
    A[0].forEach(function (var_, index) { return N.push(index); });
    signs.forEach(function (sign, index1) {
        if (sign == '<=') {
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach(function (row, index2) {
                if (index1 != index2) {
                    row.push('0');
                }
            });
        }
        if (sign == '>=') {
            N.push(total_variables);
            total_variables++;
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('-1');
            A[index1].push('1');
            artificial.push(total_variables);
            // push 0 at all other row
            A.forEach(function (row, index2) {
                if (index1 != index2) {
                    row.push('0');
                    row.push('0');
                }
            });
        }
        if (sign == '==') {
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach(function (row, index2) {
                if (index1 != index2) {
                    row.push('0');
                }
            });
            artificial.push(total_variables);
        }
        total_variables++;
    });
    console.table(A);
    console.table(B);
    console.table(N);
}
A = [
    ['1', '2', '3', '4'],
    ['1', '2', '3', '4'],
    ['1', '2', '3', '4'],
];
unrestricted.push(2);
unrestricted.push(3);
c = ['1', '2', '0'];
signs = ['<=', '>=', '=='];
simplex();
function fractional_value(value) {
    return "".concat(value.n, "/").concat(value.d);
}
function compare_value(c, d) {
    return mathjs_1.default.compare(d, c);
}
