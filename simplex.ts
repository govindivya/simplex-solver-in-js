import mathjs, { BigNumber, clone, magneticFluxQuantumDependencies, numericDependencies, parse } from 'mathjs'


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

    console.table(A);
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
        if (sign == '==') {
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

    console.table(A);
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

    console.table(A);
    console.table(B);
    console.table(N);
    console.table(b);
    console.table(c);


    if (artificial.length > 0) {
        let c1: number[] = [];
        // setting cofficient of new system
        B.forEach(val => {
            if (artificial.includes(val)) {
                c1[val] = 1;
            }
            else c1[val] = 0;
        });

        N.forEach(val => {
            c1[val] = 0;
        });

        console.table(c1);
        console.log(artificial);

        let new_system_sol = simplex(N, B, artificial, A, b, c);

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


function pivot(N: number[], B: number[], A: string[][], b: string[], c: number[], l: number, e: number) {

    let N1 = Array.from(N);
    let B1 = Array.from(B);
    let A1 = Array.from(A);
    let b1 = Array.from(b);
    let cj: string[] = [];
    let zj: string[] = [];

    for (let j = 0; j < A[0].length; j++) {
        let c_sum = 0;
        for (let i = 0; i < A.length; i++) {
            c_sum += mathjs.parse(`${A[i][j]}*${c[B[i]]}`).evaluate();
        }
    }

}

function simplex(N: number[], B: number[], artificial: number[], A: string[][], b: string[], c: string[]) {


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
        ['1/1', '-0', '3', '4'],
        ['1', '2', '-3/5', '4'],
        ['1', '2', '3', '4'],
    ]
    c = ['1', '2', '-0'];
    b = ['2', '-3', '-0'];
    signs = ['<=', '>=', '=='];
    unrestricted.push(2);
    unrestricted.push(3);

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


function compare_value(c: any, d: any) {
    return mathjs.compare(d, c);
}

