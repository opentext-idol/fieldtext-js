define([
    'peg',
    'text!fieldtext/js/field-text.pegjs'
], function(Peg, grammar) {
    return Peg.generate(grammar);
});