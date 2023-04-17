
const mathjs = require('mathjs');


function format_system(A: string[][], b: string[], c: string[]) {
    A = A.map(row => {
        row = row.map(value => {
            if (decimal_value(value) != 0) {
                if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                    return value.split('/')[0];
                }
                return value;
            }
            return '0'
        });
        return row;
    });

    b = b.map(value => {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0'
    });

    c = c.map(value => {
        if (decimal_value(value) != 0) {
            if (value.split('/').length == 2 && value.split('/')[1] == '1') {
                return value.split('/')[0];
            }
            return value;
        }
        return '0'
    });

    return { A, b, c }

}

function initiate_simplex(N: number[], B: number[], artificial: number[], signs: string[], unrestricted: number[], A: string[][], b: string[], c: string[]) {

    let formatted_data = format_system(A, b, c);

    A = formatted_data.A;
    b = formatted_data.b;
    c = formatted_data.c;

    let count = 0;
    // handling unrestricted variables.
    unrestricted.forEach((i) => {
        A = A.map(row => {
            row.splice(i + 1 + count, 0, `-${row[i + count]}`);
            return row;
        });
        count++
    });
    var total_variables = A[0].length;
    // pushing all non basic variable
    A[0].forEach(function (var_, index) { return N.push(index); });

    signs.forEach((sign, index1) => {

        if (sign == '<=') {
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach((row, index2) => {
                if (index1 != index2) {
                    row.push('0');
                }
            })
        }

        if (sign == '>=') {
            N.push(total_variables);
            total_variables++;
            B.push(total_variables)
            // push 1 at current row;
            A[index1].push('-1');
            A[index1].push('1');
            artificial.push(total_variables)
            // push 0 at all other row
            A.forEach((row, index2) => {
                if (index1 != index2) {
                    row.push('0');
                    row.push('0');
                }
            })
        }
        if (sign == '=') {
            B.push(total_variables);
            // push 1 at current row;
            A[index1].push('1');
            // push 0 at all other row
            A.forEach((row, index2) => {
                if (index1 != index2) {
                    row.push('0');
                }
            });
            artificial.push(total_variables);
        }

        total_variables++;
    });



    // each b[i] is postive after this.
    b.forEach((b_val, b_index) => {
        if (b_val[0] == '-') {
            if (decimal_value(b_val) != 0) {
                b[b_index] = b_val.substring(1);
                A[b_index].forEach((a_val, a_index) => {
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
                })
            }
            else {
                b[b_index] = '0';
            }
        }

    });




    if (artificial.length > 0) {
        let c1: string[] = [];

        /************putting artificial at end of cols starts *********** */



        let new_A1: string[][] = [];

        // first push col of non artificial var then others 

        A.forEach((row, row_ind) => {
            let tempArray: string[] = []
            row.forEach((col, col_ind) => {
                if (!artificial.includes(col_ind)) {
                    tempArray.push(col);
                }
            });
            new_A1.push(tempArray);
        });

        A.forEach((row, row_ind) => {
            row.forEach((col, col_ind) => {
                if (artificial.includes(col_ind)) {
                    new_A1[row_ind].push(col);
                }
            });
        });

        let artificial_count = artificial.length;

        // find old index and remove from basic index

        artificial.forEach((a_val, ind) => {
            let index = B.findIndex((val) => val == a_val);
            if (index != -1) {
                B.splice(index, 1);
            }
        });


        // fill basic and non basic variables;

        B = [];
        N = [];

        for (let j = 0; j < new_A1[0].length; j++) {
            let is_basic = true;
            let ones_count = 0;
            let one_pos = -1;
            for (let i = 0; i < new_A1.length; i++) {
                if (new_A1[i][j] != '0' && new_A1[i][j] != '1') {
                    is_basic = false;
                    break;
                }
                if (new_A1[i][j] == '1') {
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
        artificial = artificial.map((val, ind) => {
            return A[0].length - artificial_count + ind;
        });
        // setting cofficient of new system
        B.forEach(val => {
            if (artificial.includes(val)) {
                c1[val] = '-1';
            }
            else c1[val] = '0';
        });

        N.forEach(val => {
            c1[val] = '0';
        });

        A = [...new_A1]
        /************end******************** */


        let new_system_sol = simplex(N, B, artificial, A, b, c1);

        N = new_system_sol.N;
        B = new_system_sol.B;
        A = new_system_sol.A;
        b = new_system_sol.b;
        let A1: string[][] = [[]]

        A.forEach((row_val, row_index) => {
            A1[row_index] = [];
            row_val.forEach((col_val, col_index) => {
                if (!artificial.includes(col_index)) {
                    A1[row_index].push(col_val);
                }
            })
        });



    }
}

function common_task(N: number[], B: number[], A: string[][], b: string[], c: string[]){

    let N1: number[] = [];
    let B1: number[] = [];
    let A1 = Array.from(A);
    let b1 = Array.from(b);
    let cjzj: string[] = [];
    let zj: string[] = [];





    for (let j = 0; j < A[0].length; j++) {
        let z_sum = '0';
        for (let i = 0; i < A.length; i++) {
            z_sum = fractional_string(mathjs.fraction(mathjs.parse(`${z_sum}+(${A[i][j]})*${c[B[i]]}`).evaluate()))
        }
        zj.push(z_sum);
    }



    c.forEach((ci, ind) => {
        cjzj.push(fractional_string(mathjs.fraction(mathjs.parse(`${ci}-${zj[ind]}`).evaluate())))
    });




    let max_col_index: number = -1;
    let max_col_value = '-1';

    cjzj.forEach((val, ind) => {
        if (mathjs.compare(mathjs.parse(`${val}`).evaluate(), mathjs.parse(`${max_col_value}`).evaluate()) == 1) {
            max_col_index = ind;
            max_col_value = val;
        }
    });




    let min_ratio_index: number = -1;
    let min_ratio_value: string = '';

    // checking if any postive ratio exists
    A.forEach((row, ind) => {
        if (mathjs.parse(`${row[max_col_index]}`).evaluate() > 0) {
            min_ratio_index = ind;
            min_ratio_value = `${b[ind]}/${A[ind][max_col_index]}`;
        }
    });

    if (min_ratio_index == -1) {
        throw Error("UNBOUNDED SOLUTION")
    }

    // // checking for min positive ratio
    // console.log("A");
    // console.table(A);
    A.forEach((row, ind) => {
        if (mathjs.parse(`${row[max_col_index]}`).evaluate() > 0 && (mathjs.parse(b[ind]).evaluate() >= 0) && (mathjs.compare(mathjs.parse(min_ratio_value).evaluate(), mathjs.parse(`${b[ind]}/${row[max_col_index]}`).evaluate()) == 1)) {
            min_ratio_index = ind;
            min_ratio_value = `${b[min_ratio_index]}/${A[min_ratio_index][max_col_index]}`;
        }
    });

    let pivot_element = A[min_ratio_index][max_col_index];
    let leaving_var = B[min_ratio_index];

    A1 = Array.from(A);
    b1 = [...b];




    b1[min_ratio_index] = fractional_string(mathjs.fraction(mathjs.parse(`(${b[min_ratio_index]})/${pivot_element}`).evaluate()));
    for (let i = 0; i < A.length; i++) {
        if (i != min_ratio_index) {
            for (let j = 0; j < A[0].length; j++) {
                if (j != max_col_index && !B.includes(j)) {
                    A1[i][j] = fractional_string(mathjs.fraction(mathjs.parse(`((${A[i][j]})*${pivot_element}-(${A[i][max_col_index]})*${A[min_ratio_index][j]})/${pivot_element}`).evaluate()));
                }
            }
            b1[i] = fractional_string(mathjs.fraction(mathjs.parse(`(${b[i]}*(${pivot_element})-(${A[i][max_col_index]})*${b[min_ratio_index]})/${pivot_element}`).evaluate()));
        }
    }

    for (let i = 0; i < A.length; i++) {
        if (i != min_ratio_index) {
            A1[i][min_ratio_index] = '0';
        }
    }

    ;

    A1 = A1.map((row, _rowIndex) => {
        if (_rowIndex == min_ratio_index) {
            row = row.map(elem => {
                return fractional_string(mathjs.fraction(mathjs.parse(`${elem}/(${pivot_element})`).evaluate()));
            });
        }
        return row;
    });



    A = A1.map((row) => {
        row.splice(B[min_ratio_index], 1);
        return row;
    });


    // filtering basic and non basic variables.

    for (let j = 0; j < A1[0].length; j++) {

        let is_basic = true;
        let ones_count = 0;
        let one_pos = -1;

        for (let i = 0; i < A1.length; i++) {
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

    return {
        A:A1,
        B:B1,
        N:N1,
        b:b1  
    }
}


function phase1(N: number[], B: number[], A: string[][], b: string[], c: string[], artificial: number[]) {


    if (artificial.length == 0) {
        console.log("OPTIMAL");
        return {
            A,
            B,
            N,
            b,
            artificial,
            optimal: true,
            c
        }
    }

    let N1: number[] = [];
    let B1: number[] = [];
    let A1 = Array.from(A);
    let b1 = Array.from(b);
    let cjzj: string[] = [];
    let c1: string[] = []
    let zj: string[] = [];





    for (let j = 0; j < A[0].length; j++) {
        let z_sum = '0';
        for (let i = 0; i < A.length; i++) {
            z_sum = fractional_string(mathjs.fraction(mathjs.parse(`${z_sum}+(${A[i][j]})*${c[B[i]]}`).evaluate()))
        }
        zj.push(z_sum);
    }



    c.forEach((ci, ind) => {
        cjzj.push(fractional_string(mathjs.fraction(mathjs.parse(`${ci}-${zj[ind]}`).evaluate())))
    });




    let max_col_index: number = -1;
    let max_col_value = '-1';

    cjzj.forEach((val, ind) => {
        if (mathjs.compare(mathjs.parse(`${val}`).evaluate(), mathjs.parse(`${max_col_value}`).evaluate()) == 1) {
            max_col_index = ind;
            max_col_value = val;
        }
    });




    let min_ratio_index: number = -1;
    let min_ratio_value: string = '';

    // checking if any postive ratio exists
    A.forEach((row, ind) => {
        if (mathjs.parse(`${row[max_col_index]}`).evaluate() > 0) {
            min_ratio_index = ind;
            min_ratio_value = `${b[ind]}/${A[ind][max_col_index]}`;
        }
    });

    if (min_ratio_index == -1) {
        throw Error("UNBOUNDED SOLUTION")
    }

    // // checking for min positive ratio
    // console.log("A");
    // console.table(A);
    A.forEach((row, ind) => {
        if (mathjs.parse(`${row[max_col_index]}`).evaluate() > 0 && (mathjs.parse(b[ind]).evaluate() >= 0) && (mathjs.compare(mathjs.parse(min_ratio_value).evaluate(), mathjs.parse(`${b[ind]}/${row[max_col_index]}`).evaluate()) == 1)) {
            min_ratio_index = ind;
            min_ratio_value = `${b[min_ratio_index]}/${A[min_ratio_index][max_col_index]}`;
        }
    });

    let pivot_element = A[min_ratio_index][max_col_index];
    let leaving_var = B[min_ratio_index];

    A1 = Array.from(A);
    b1 = [...b];




    b1[min_ratio_index] = fractional_string(mathjs.fraction(mathjs.parse(`(${b[min_ratio_index]})/${pivot_element}`).evaluate()));
    for (let i = 0; i < A.length; i++) {
        if (i != min_ratio_index) {
            for (let j = 0; j < A[0].length; j++) {
                if (j != max_col_index && !B.includes(j)) {
                    A1[i][j] = fractional_string(mathjs.fraction(mathjs.parse(`((${A[i][j]})*${pivot_element}-(${A[i][max_col_index]})*${A[min_ratio_index][j]})/${pivot_element}`).evaluate()));
                }
            }
            b1[i] = fractional_string(mathjs.fraction(mathjs.parse(`(${b[i]}*(${pivot_element})-(${A[i][max_col_index]})*${b[min_ratio_index]})/${pivot_element}`).evaluate()));
        }
    }

    for (let i = 0; i < A.length; i++) {
        if (i != min_ratio_index) {
            A1[i][min_ratio_index] = '0';
        }
    }

    ;

    A1 = A1.map((row, _rowIndex) => {
        if (_rowIndex == min_ratio_index) {
            row = row.map(elem => {
                return fractional_string(mathjs.fraction(mathjs.parse(`${elem}/(${pivot_element})`).evaluate()));
            });
        }
        return row;
    });



    A = A1.map((row) => {
        row.splice(B[min_ratio_index], 1);
        return row;
    });


    // filtering basic and non basic variables.

    for (let j = 0; j < A1[0].length; j++) {

        let is_basic = true;
        let ones_count = 0;
        let one_pos = -1;

        for (let i = 0; i < A1.length; i++) {
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
        c.forEach((val, ind) => {
            if (ind != leaving_var) {
                c1.push(val);
            }
        });
    }

    let artificial1: number[] = [];


    artificial.forEach(a_val => {
        if (a_val != leaving_var) {
            artificial1.push(a_val);
        }
    });

    artificial1 = artificial1.map((val) => {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });

    artificial = [...artificial1];

    B = B1.map((val) => {
        if (val > leaving_var) {
            return val - 1;
        }
        return val;
    });

    N = [];
    A[0].forEach((col, ind) => {
        if (!B.includes(ind)) {
            N.push(ind);
        }
    })


    console.log("A");
    console.table(A);
    console.log("b");
    console.table(b1);
    console.log("B");
    console.table(B);
    console.log("N");
    console.table(N);
    console.log("c");
    console.table(c1);
    console.log("ARTFICIAL");
    console.table(artificial);

    console.table(zj);
    console.table(cjzj);


    return {
        A,
        B,
        N,
        b: b1,
        artificial,
        optimal: false,
        c: c1
    }


}

function simplex(N: number[], B: number[], artificial: number[], A: string[][], b: string[], c: string[]) {

    while (true) {
        let solution = phase1(N, B, A, b, c, artificial);

        if (solution.A && solution.b && solution.N && solution.B && solution.artificial) {
            A = solution.A;
            b = solution.b;
            B = solution.B;
            N = solution.B;
            artificial = solution.artificial;
            c = solution.c;
        }


        console.log('optimal ', solution.optimal);
        if (solution.optimal == true) {
            console.log("OPTIMAL`");
            break;
        }
    }


    return { N, B, A, b, c, v: 0 }
}




function take_input() {

    var A: string[][] = [[]];
    var b: string[] = [];
    var c: string[] = [];
    var B: number[] = [];
    var N: number[] = [];
    var artificial: number[] = [];
    var signs: string[] = []
    var unrestricted: number[] = []


    A = [
        ['3', '1'],
        ['4', '3'],
        ['1', '2'],
    ]
    c = ['-4', '-1'];
    b = ['3', '6', '4'];
    signs = ['=', '>=', '<='];
    // unrestricted.push(2);
    // unrestricted.push(3);
    initiate_simplex(N, B, artificial, signs, unrestricted, A, b, c);
}

take_input()

function decimal_value(value: string): number {
    let result = value.split('/');
    if (result.length == 1) {
        return Number(result[0]);
    }
    else if (result.length == 2) {
        return Number(result[0]) / Number(result[1]);
    }
    throw new Error("Invalid fraction value")
}

function fractional_string(value: any) {
    if (value.s == -1) {
        if (value.d == value.n) {
            return '-1'
        }
        if (value.d != 1) return `-${value.n}/${value.d}`;
        return `-${value.n}`
    }
    if (value.d == value.n) {
        return '1'
    }
    if (value.d != 1) return `${value.n}/${value.d}`;
    return `${value.n}`
}

function fraction_value(value: string): { n: number, d?: number } {
    let result = value.split('/');
    if (result.length == 1) {
        return { n: Number(result[0]) }
    }
    else if (result.length == 2) {
        return { n: Number(result[0]), d: Number(result[1]) }

    }
    throw new Error("Invalid fraction value")
}



