define([
    'underscore',
    'fieldtext/js/parser'
], function(_, parser) {
    "use strict";

    // Order-of-precedence table as implemented in IDOL; according to Chris Rayson.
    // The commented-out ones aren't currently implemented in this API, but are noted here for future reference.
    // If implementing them, you'll need the numeric and negated forms as well, e.g. 'WHENN' and 'NOTWHEN'.
    var priority = {
        OR: 1,
        XOR: 1,
        // WNEAR: 1,
        AND: 2,
        // WHEN: 2,
        // SENTENCE: 2,
        // PARAGRAPH: 2,
        BEFORE: 2,
        AFTER: 2,
        // NEAR: 3,
        // DNEAR: 3,
        // XNEAR: 3,
        // YNEAR: 3,
        NOT: 4,
        BRACKETS: 5,
        // EXPRESSION doesn't really exist in IDOL, just setting it to the max to simplify auto-bracket implementation.
        EXPRESSION: 6
    }

    function bracket(child, parent) {
        if (child.priority < parent.priority) {
            // If we have a low-priority operator e.g. an OR nested inside a AND, then we should automatically add
            //   brackets when printing it as a string so the tree will be interpreted correctly.
            return '(' + child.toString() + ')';
        }
        return child.toString();
    }

    var BooleanNode = function(operator, left, right) {
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.priority = priority[operator];
    };

    BooleanNode.build = function(node) {
        return new BooleanNode(node.boolean, convert(node.left), convert(node.right));
    };

    _.extend(BooleanNode.prototype, {
        toString: function() {
            return [bracket(this.left, this), this.operator, bracket(this.right, this)].join(' ')
        }
    });

    var BracketedNode = function(node) {
        this.fieldText = convert(node.fieldtext);
    };

    BracketedNode.build = function(node) {
        return new BracketedNode(node);
    };

    _.extend(BracketedNode.prototype, {
        priority: priority.BRACKETS,
        toString: function() {
            return '(' + this.fieldText.toString() + ')';
        }
    });

    var ExpressionNode = function(operator, fields, values) {
        this.operator = operator;
        this.fields = fields;
        this.values = values;
    };

    ExpressionNode.build = function(node) {
        return new ExpressionNode(node.operator, node.fields, node.values);
    };

    _.extend(ExpressionNode.prototype, {
        priority: priority.EXPRESSION,
        toString: function() {
            return this.operator + '{' +
                this.values.join(',') + '}' + ':' +
                this.fields.join(':');
        }
    });

    _.each([ExpressionNode.prototype, BracketedNode.prototype, BooleanNode.prototype], function(nodeType) {
        _.extend(nodeType, _.reduce(['AND', 'OR', 'XOR', 'BEFORE', 'AFTER'], function(methods, operator) {
            methods[operator] = function(right) {
                return new BooleanNode(operator, this, right);
            };

            return methods;
        }, {}));
    });

    var NegativeNode = function(node) {
        var newNode = _.clone(node);
        delete newNode.negative;

        this.fieldText = convert(newNode);
    };

    NegativeNode.build = function(node) {
        return new NegativeNode(node);
    };

    _.extend(NegativeNode.prototype, {
        priority: priority.NOT,
        negative: true,

        toString: function() {
            return 'NOT ' + bracket(this.fieldText, this);
        }
    });

    var convert = function(node) {
        if(node.boolean) {
            return BooleanNode.build(node);
        }
        else if(node.negative) {
            return NegativeNode.build(node);
        }
        else if(node.fieldtext) {
            return BracketedNode.build(node);
        }
        else {
            return ExpressionNode.build(node);
        }
    };

    var module = {
        ExpressionNode: ExpressionNode,
        Null: {
            toString: function() {
                return null;
            }
        },

        parse: function(fieldText) {
            var tree = parser.parse(fieldText);

            return convert(tree);
        }
    };

    _.extend(module, _.reduce(['AND', 'OR', 'XOR', 'BEFORE', 'AFTER'], function(methods, operator) {
        methods[operator] = function(left, right) {
            if(left && right) {
                return left[operator](right);
            } else if(left) {
                return left;
            } else if(right) {
                return right;
            } else {
                return module.Null
            }
        };

        return methods;
    }, {}));

    return module;
});
