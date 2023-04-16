var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var mathjs = require('mathjs');
function format_system(A, b, c) {
    A = A.map(function (row) {
        row = row.map(function (value) {
            if (decimal_value(value) != 0) {
                if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                    return value.split('/')[0];
                }
                return value;
            }
            return '0';
        });
        return row;
    });
    b = b.map(function (value) {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0';
    });
    c = c.map(function (value) {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0';
    });
    return { A: A, b: b, c: c };
}
function initiate_simplex(N, B, artificial, signs, unrestricted, A, b, c) {
    var formatted_data = format_system(A, b, c);
    A = formatted_data.A;
    b = formatted_data.b;
    c = formatted_data.c;
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
        if (sign == '=') {
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
    // each b[i] is postive after this.
    b.forEach(function (b_val, b_index) {
        if (b_val[0] == '-') {
            if (decimal_value(b_val) != 0) {
                b[b_index] = b_val.substring(1);
                A[b_index].forEach(function (a_val, a_index) {
                    // value is negative remove minus sign
                    if (decimal_value(a_val) != 0) {
                        if (a_val[0] == '-') {
                            A[b_index][a_index] = a_val.substring(1);
                        }
                        //else add minus sign.
                        else {
                            A[b_index][a_index] = '-' + a_val;
                        }
                    }
                    else {
                        A[b_index][a_index] = '0';
                    }
                });
            }
            else {
                b[b_index] = '0';
            }
        }
    });
    if (artificial.length > 0) {
        var c1_1 = [];
        /************putting artificial at end of cols starts *********** */
        var new_A1_1 = [];
        // first push col of non artificial var then others 
        A.forEach(function (row, row_ind) {
            var tempArray = [];
            row.forEach(function (col, col_ind) {
                if (!artificial.includes(col_ind)) {
                    tempArray.push(col);
                }
            });
            new_A1_1.push(tempArray);
        });
        A.forEach(function (row, row_ind) {
            row.forEach(function (col, col_ind) {
                if (artificial.includes(col_ind)) {
                    new_A1_1[row_ind].push(col);
                }
            });
        });
        var artificial_count_1 = artificial.length;
        // find old index and remove from basic index
        artificial.forEach(function (a_val, ind) {
            var index = B.findIndex(function (val) { return val == a_val; });
            if (index != -1) {
                B.splice(index, 1);
            }
        });
        // fill basic and non basic variables;
        B = [];
        N = [];
        for (var j = 0; j < new_A1_1[0].length; j++) {
            var is_basic = true;
            var ones_count = 0;
            var one_pos = -1;
            for (var i = 0; i < new_A1_1.length; i++) {
                if (new_A1_1[i][j] != '0' && new_A1_1[i][j] != '1') {
                    is_basic = false;
                    break;
                }
                if (new_A1_1[i][j] == '1') {
                    one_pos = i;
                    ones_count++;
                }
            }
            if (ones_count > 1 || !is_basic) {
                N.push(j);
            }
            else {
                B[one_pos] = j;
            }
        }
        // return new index of artificial variable.
        artificial = artificial.map(function (val, ind) {
            return A[0].length - artificial_count_1 + ind;
        });
        // setting cofficient of new system
        B.forEach(function (val) {
            if (artificial.includes(val)) {
                c1_1[val] = '-1';
            }
            else
                c1_1[val] = '0';
        });
        N.forEach(function (val) {
            c1_1[val] = '0';
        });
        A = __spreadArray([], new_A1_1, true);
        /************end******************** */
        var new_system_sol = simplex(N, B, artificial, A, b, c1_1);
        N = new_system_sol.N;
        B = new_system_sol.B;
        A = new_system_sol.A;
        b = new_system_sol.b;
        var A1_1 = [[]];
        A.forEach(function (row_val, row_index) {
            A1_1[row_index] = [];
            row_val.forEach(function (col_val, col_index) {
                if (!artificial.includes(col_index)) {
                    A1_1[row_index].push(col_val);
                }
            });
        });
    }
}
function pivot(N, B, A, b, c, artificial) {
    var N1 = [];
    var B1 = [];
    var A1 = Array.from(A);
    var b1 = Array.from(b);
    var cjzj = [];
    var c1 = [];
    var zj = [];
    for (var j = 0; j < A[0].length; j++) {
        var z_sum = '0';
        for (var i = 0; i < A.length; i++) {
            z_sum = fractional_string(mathjs.fraction(mathjs.parse("(".concat(z_sum, ")+(").concat(A[i][j], ")*(").concat(c[B[i]], ")")).evaluate()));
        }
        zj.push(z_sum);
    }
    c.forEach(function (ci, ind) {
        cjzj.push(fractional_string(mathjs.fraction(mathjs.parse("".concat(ci, "-").concat(zj[ind])).evaluate())));
    });
    var max_col_index = -1;
    var max_col_value = '-1';
    cjzj.forEach(function (val, ind) {
        if (mathjs.compare(mathjs.parse("".concat(val)).evaluate(), mathjs.parse("".concat(max_col_value)).evaluate()) == 1) {
            max_col_index = ind;
            max_col_value = val;
        }
    });
    if (max_col_index == -1) {
        artificial.forEach(function (a_val) {
            if (B.includes(a_val)) {
                throw Error("NO SOLUTION FOUND");
            }
            return {
                "OPTIMAL": true,
                A: A,
                B: B,
                N: N,
                b: b,
                artificial: artificial,
                c: c
            };
        });
    }
    var min_ratio_index = -1;
    var min_ratio_value = '';
    // checking if any postive ratio exists
    A.forEach(function (row, ind) {
        if (mathjs.parse("".concat(row[max_col_index])).evaluate() > 0) {
            min_ratio_index = ind;
            min_ratio_value = "(".concat(b[ind], ")/(").concat(A[ind][max_col_index], ")");
        }
    });
    if (min_ratio_index == -1) {
        throw Error("UNBOUNDED SOLUTION");
    }
    // // checking for min positive ratio
    // console.log("A");
    // console.table(A);
    A.forEach(function (row, ind) {
        if (mathjs.parse("".concat(row[max_col_index])).evaluate() > 0 && (mathjs.parse(b[ind]).evaluate() >= 0) && (mathjs.compare(mathjs.parse(min_ratio_value).evaluate(), mathjs.parse("".concat(b[ind], "/").concat(row[max_col_index])).evaluate()) == 1)) {
            min_ratio_index = ind;
            min_ratio_value = "(".concat(b[min_ratio_index], ")/(").concat(A[min_ratio_index][max_col_index], ")");
        }
    });
    var pivot_element = A[min_ratio_index][max_col_index];
    var leaving_var = B[min_ratio_index];
    A1 = Array.from(A);
    b1 = __spreadArray([], b, true);
    console.log("Before");
    console.log(min_ratio_index, max_col_index);
    console.table(A1);
    b1[min_ratio_index] = fractional_string(mathjs.fraction(mathjs.parse("(".concat(b[min_ratio_index], ")/(").concat(pivot_element, ")")).evaluate()));
    for (var i = 0; i < A.length; i++) {
        if (i != min_ratio_index) {
            for (var j = 0; j < A[0].length; j++) {
                if (j != max_col_index && !B.includes(j)) {
                    A1[i][j] = fractional_string(mathjs.fraction(mathjs.parse("((".concat(A[i][j], ")*(").concat(pivot_element, ")-(").concat(A[i][max_col_index], ")*(").concat(A[min_ratio_index][j], "))/(").concat(pivot_element, ")")).evaluate()));
                }
            }
            b1[i] = fractional_string(mathjs.fraction(mathjs.parse("((".concat(b[i], ")*(").concat(pivot_element, ")-(").concat(A[i][max_col_index], ")*(").concat(b[min_ratio_index], "))/(").concat(pivot_element, ")")).evaluate()));
        }
    }
    console.table(A);
    for (var i = 0; i < A.length; i++) {
        if (i != min_ratio_index) {
            A[i][min_ratio_index] = '0';
        }
    }
    A1 = A1.map(function (row, _rowIndex) {
        if (_rowIndex == min_ratio_index) {
            row = row.map(function (elem) {
                return fractional_string(mathjs.fraction(mathjs.parse("(".concat(elem, ")/(").concat(pivot_element, ")")).evaluate()));
            });
        }
        return row;
    });
    A = A1.map(function (row) {
        row.splice(B[min_ratio_index], 1);
        return row;
    });
    console.log("after");
    console.table(A);
    // filtering basic and non basic variables.
    for (var j = 0; j < A1[0].length; j++) {
        var is_basic = true;
        var ones_count = 0;
        var one_pos = -1;
        for (var i = 0; i < A1.length; i++) {
            if (A1[i][j] != '0' && A1[i][j] != '1') {
                is_basic = false;
                break;
            }
            if (A1[i][j] == '1') {
                one_pos = i;
                ones_count++;
            }
        }
        if (ones_count > 1 || !is_basic) {
            N1.push(j);
        }
        else {
            B1[one_pos] = j;
        }
    }
    if (artificial.includes(leaving_var)) {
        c1 = [];
        c.forEach(function (val, ind) {
            if (ind != leaving_var) {
                c1.push(val);
            }
        });
    }
    var artificial1 = [];
    artificial.forEach(function (a_val) {
        if (a_val != leaving_var) {
            artificial1.push(a_val);
        }
    });
    artificial1 = artificial1.map(function (val) {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });
    artificial = __spreadArray([], artificial1, true);
    B = B1.map(function (val) {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });
    N = [];
    A[0].forEach(function (col, ind) {
        if (!B.includes(ind)) {
            N.push(ind);
        }
    });
    // console.log("A");
    // console.table(A);
    // console.log("b");
    // console.table(b1);
    // console.log("B");
    // console.table(B);
    // console.log("N");
    // console.table(N);
    // console.log("c");
    // console.table(c1);
    // console.log("ARTFICIAL");
    // console.table(artificial);
    // console.table(zj);
    // console.table(cjzj);
    return {
        A: A,
        B: B,
        N: N,
        b: b1,
        artificial: artificial,
        "OPTIMAL": false,
        c: c1
    };
}
function simplex(N, B, artificial, A, b, c) {
    var i = 0;
    while (i < 5) {
        var solution = pivot(N, B, A, b, c, artificial);
        if (solution.A && solution.b && solution.N && solution.B && solution.artificial) {
            A = solution.A;
            b = solution.b;
            B = solution.B;
            N = solution.B;
            artificial = solution.artificial;
            c = solution.c;
        }
        i++;
        if (solution.OPTIMAL == true) {
            break;
        }
    }
    return { N: N, B: B, A: A, b: b, c: c, v: 0 };
}
function take_input() {
    var A = [[]];
    var b = [];
    var c = [];
    var B = [];
    var N = [];
    var artificial = [];
    var signs = [];
    var unrestricted = [];
    A = [
        ['3', '1'],
        ['4', '3'],
        ['1', '2'],
    ];
    c = ['-4', '-1'];
    b = ['3', '6', '4'];
    signs = ['=', '>=', '<='];
    // unrestricted.push(2);
    // unrestricted.push(3);
    initiate_simplex(N, B, artificial, signs, unrestricted, A, b, c);
}
take_input();
function decimal_value(value) {
    var result = value.split('/');
    if (result.length == 1) {
        return Number(result[0]);
    }
    else if (result.length == 2) {
        return Number(result[0]) / Number(result[1]);
    }
    throw new Error("Invalid fraction value");
}
function fractional_string(value) {
    if (value.s == -1) {
        if (value.d == value.n) {
            return '-1';
        }
        if (value.d != 1)
            return "-".concat(value.n, "/").concat(value.d);
        return "-".concat(value.n);
    }
    if (value.d == value.n) {
        return '1';
    }
    if (value.d != 1)
        return "".concat(value.n, "/").concat(value.d);
    return "".concat(value.n);
}
function fraction_value(value) {
    var result = value.split('/');
    if (result.length == 1) {
        return { n: Number(result[0]) };
    }
    else if (result.length == 2) {
        return { n: Number(result[0]), d: Number(result[1]) };
    }
    throw new Error("Invalid fraction value");
}
