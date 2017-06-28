{
    function leftAlign(left, boolean, right) {
        if (right.boolean) {
            return {
                boolean: right.boolean,
                left: leftAlign(left, boolean, right.left),
                right: right.right
            }
        } else {
            return {
                boolean: boolean,
                left: left,
                right: right
            }
        }
    }

    function postProcess(input) {
        var next = input.next;
        delete input.next

        if (!next) {
            return input;
        } else {
            var boolean = next.boolean;
            var right = next.right;

            return leftAlign(input, boolean, right);
        }
    }

    function postProcessNegation(input) {
        var target = input;

        while(target.left) {
            target = target.left
        }

        target.negative = true;

        return postProcess(input);
    }
}

start
    = fieldtext

fieldtext
    = operator:operator '{' csv:csv '}' colonsv:colonsv next:fieldtextPrime { return postProcess({ operator: operator, values: csv , fields: colonsv, next: next}) }
    / _ '(' _ fieldtext:fieldtext _ ')' next:fieldtextPrime { return postProcess({fieldtext: fieldtext, next: next}) }
    / 'NOT' __ fieldtext:fieldtext next:fieldtextPrime { fieldtext.next = next; return postProcessNegation(fieldtext) }


fieldtextPrime
    = __ boolean:boolean __ rhs:fieldtext next:fieldtextPrime { return postProcess({ boolean: boolean, right: rhs, next: next}) }
    / '' {return undefined;}

operator
    = chars:[A-Z]+ { return chars.join('') }

boolean
    = 'OR'
    / 'AND'
    / 'XOR'


colonsv
    = ':' head:field tail:colonsv { return [head].concat(tail); }
    / ':' field:field { return [field]; }

csv
    = csvPrime
    / '' { return []; }

csvPrime
    = head:value ',' tail:csvPrime { return [head].concat(tail); }
    / val:value { return [val]; }

field
    = chars:[A-Za-z0-9_/]+ { return chars.join(''); }

value
    = chars:[^,{}]+ { return chars.join(''); }

_
    = ' '*

__
    = _'+'_
    / ' '+
