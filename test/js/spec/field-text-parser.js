define([
    'fieldtext/js/field-text-parser'
], function(parser) {
    describe('FieldText', function() {
        describe('Parser', function() {
            describe('should match field text elements with field values', function() {
                it('', function() {
                    var fieldText = "MATCH{sodium cyanide,potassium chloride}:poisons:chemicals";

                    var result = parser.parse(fieldText);

                    expect(result.operator).toBe("MATCH");
                    expect(result.fields).toContain("poisons", "chemicals");
                    expect(result.values).toContain("sodium cyanide", "potassium chloride");
                });

                it(', even if fieldnames contain digits', function() {
                    var fieldText = "MATCH{sodium cyanide,potassium chloride}:poisons1:chemicals2";

                    var result = parser.parse(fieldText);

                    expect(result.operator).toBe("MATCH");
                    expect(result.fields).toContain("poisons1", "chemicals2");
                    expect(result.values).toContain("sodium cyanide", "potassium chloride");
                });

                it(', even if fieldnames contain slashes', function() {
                    var fieldText = "MATCH{sodium cyanide,potassium chloride}:xml/path/poisons1:/other/path/chemicals2";

                    var result = parser.parse(fieldText);

                    expect(result.operator).toBe("MATCH");
                    expect(result.fields).toContain("xml/path/poisons1", "/other/path/chemicals2");
                    expect(result.values).toContain("sodium cyanide", "potassium chloride");
                });
            });

            it('should match field text elements without field values', function() {
                var fieldText = "EXISTS{}:curry";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("EXISTS");
                expect(result.fields).toContain("curry");
                expect(result.values).toEqual([]);
            });

            it('should match field text booleans', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:poisons:chemicals AND EXISTS{}:curry";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("AND");
                expect(result.left.operator).toBe("MATCH");
                expect(result.right.operator).toBe("EXISTS");
            });

            it("should accept multiple spaces in place of a single space", function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:poisons:chemicals  AND   EXISTS{}:curry";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("AND");
                expect(result.left.operator).toBe("MATCH");
                expect(result.right.operator).toBe("EXISTS");
            });

            it("should accept '+' in place of a space", function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:poisons:chemicals AND+EXISTS{}:curry";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("AND");
                expect(result.left.operator).toBe("MATCH");
                expect(result.right.operator).toBe("EXISTS");
            });

            it("should allow arbitrary number of spaces around '+'", function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:poisons:chemicals +  AND+ EXISTS{}:curry";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("AND");
                expect(result.left.operator).toBe("MATCH");
                expect(result.right.operator).toBe("EXISTS");
            });

            it('should match field text elements with field values which have underscores in them', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("MATCH");
                expect(result.fields).toContain("generic_poisons", "bad_chemicals");
                expect(result.values).toContain("sodium cyanide", "potassium chloride");
            });

            it('should match field text elements with values that have hyphens in them', function() {
                var fieldText = "MATCH{crazy-cats}:category";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("MATCH");
                expect(result.fields).toContain("category");
                expect(result.values).toContain("crazy-cats");
            });

            it('should match field text elements with values that have asterisks in them', function() {
                var fieldText = "WILD{*town}:title";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("WILD");
                expect(result.fields).toContain("title");
                expect(result.values).toContain("*town");
            });

            it('should fail on trailing colons in the fields', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:poisons:chemicals:";

                expect(function() {
                    parser.parse(fieldText)
                }).toThrow();
            });

            it('should fail on trailing commas in the values', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride,}:poisons:chemicals";

                expect(function() {
                    parser.parse(fieldText)
                }).toThrow();
            });

            it('should fail on an empty field list', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:";

                expect(function() {
                    parser.parse(fieldText)
                }).toThrow();
            });

            it('should fail on an empty field list', function() {
                var fieldText = "{sodium cyanide,potassium chloride}";

                expect(function() {
                    parser.parse(fieldText)
                }).toThrow();
            });

            it('should fail on an empty operator', function() {
                var fieldText = "{sodium cyanide,potassium chloride}:poisons:chemicals";

                expect(function() {
                    parser.parse(fieldText)
                }).toThrow();
            });

            it('should force brackets to take precedence over NOT', function() {
                var fieldText = "NOT (A{av}:af AND B{bv}:bf)";

                var result = parser.parse(fieldText);

                expect(result.negative).toBe(true);
                expect(result.fieldText.fieldText.operator).toBe("AND");
                expect(result.fieldText.fieldText.left.operator).toBe("A");
                expect(result.fieldText.fieldText.right.operator).toBe("B");
            });

            it('should force NOT to take precedence over AND', function() {
                var fieldText = "NOT A{av}:af AND B{bv}:bf";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("AND");
                expect(result.left.negative).toBe(true);
                expect(result.left.fieldText.operator).toBe("A");
                expect(result.right.negative).toBe(undefined);
                expect(result.right.operator).toBe("B");
            });

            it('should expect boolean terms to be left-associative', function() {
                var fieldText = "A{av}:af AND B{bv}:bf AND C{cv}:cf";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("AND");
                expect(result.left.operator).toBe("AND");
                expect(result.left.left.operator).toBe("A");
                expect(result.left.right.operator).toBe("B");
                expect(result.right.operator).toBe("C");
            });

            it('should expect boolean terms to have AND binding with higher precedence than OR', function() {
                var fieldText = "A{av}:af AND B{bv}:bf OR C{cv}:cf";

                var result = parser.parse(fieldText);

                expect(result.operator).toBe("OR");
                expect(result.left.operator).toBe("AND");
                expect(result.left.left.operator).toBe("A");
                expect(result.left.right.operator).toBe("B");
                expect(result.right.operator).toBe("C");

                fieldText = "A{av}:af OR B{bv}:bf AND C{cv}:cf";

                result = parser.parse(fieldText);

                expect(result.operator).toBe("OR");
                expect(result.left.operator).toBe("A");
                expect(result.right.operator).toBe("AND");
                expect(result.right.left.operator).toBe("B");
                expect(result.right.right.operator).toBe("C");
            });

            it('should expect AND operator on tree structures to return the AND of those tree structures.', function() {
                var fieldTextA = "(A{av}:af AND B{bv}:bf)";
                var fieldTextB = "(C{cv}:cf AND D{dv}:df)";

                var resultA = parser.parse(fieldTextA);
                var resultB = parser.parse(fieldTextB);
                var resultC = resultA.AND(resultB);

                expect(resultC.toString()).toBe("(A{av}:af AND B{bv}:bf) AND (C{cv}:cf AND D{dv}:df)");
            });

            it('should expect BEFORE operator on tree structures to return the BEFORE of those tree structures.', function() {
                var fieldTextA = "(NOT A{av}:af AND B{bv}:bf)";
                var fieldTextB = "(C{cv}:cf AND NOT D{dv}:df)";

                var resultA = parser.parse(fieldTextA);
                var resultB = parser.parse(fieldTextB);
                var resultC = resultA.BEFORE(resultB);

                expect(resultC.toString()).toBe("(NOT A{av}:af AND B{bv}:bf) BEFORE (C{cv}:cf AND NOT D{dv}:df)");
            });
        });

        describe('toString Method', function() {
            it('should turn a single element tree to String', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals";
                var result = parser.parse(fieldText).toString();

                expect(result).toBe("MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals");
            });

            it('should turn some unbracketed element tree to String', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals AND MATCH{thousand island}:oil_based:salad_dressings OR EXISTS{}:fried_turnips";
                var result = parser.parse(fieldText).toString();

                expect(result).toBe("MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals AND MATCH{thousand island}:oil_based:salad_dressings OR EXISTS{}:fried_turnips");
            });

            it('should turn a bracketed element tree to String', function() {
                var fieldText = "(MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals AND MATCH{thousand island}:oil_based:salad_dressings) OR EXISTS{}:fried_turnips";
                var result = parser.parse(fieldText).toString();

                expect(result).toBe("(MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals AND MATCH{thousand island}:oil_based:salad_dressings) OR EXISTS{}:fried_turnips");
            });

            it('should turn not elements to String', function() {
                var fieldText = "NOT (MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals AND NOT MATCH{thousand island}:oil_based:salad_dressings) OR NOT EXISTS{}:fried_turnips";
                var result = parser.parse(fieldText).toString();

                expect(result).toBe("NOT (MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals AND NOT MATCH{thousand island}:oil_based:salad_dressings) OR NOT EXISTS{}:fried_turnips");
            });

            it('should turn EOR to XOR', function() {
                var fieldText = "MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals EOR MATCH{thousand island}:oil_based:salad_dressings";
                var result = parser.parse(fieldText).toString();

                expect(result).toBe("MATCH{sodium cyanide,potassium chloride}:generic_poisons:bad_chemicals XOR MATCH{thousand island}:oil_based:salad_dressings");
            });

            it('should work on the NOT operator', function() {
                var node = new parser.ExpressionNode('MATCH', ['f1'], [1]);
                var result = parser.NOT(node).toString();

                expect(result).toBe("NOT MATCH{1}:f1");
            });

            describe('should automatically add brackets', function() {
                var one = new parser.ExpressionNode('MATCH', ['f1'], [1]);
                var two = new parser.ExpressionNode('MATCH', ['f2'], [2]);
                var three = new parser.ExpressionNode('MATCH', ['f3'], [3]);
                var four = new parser.ExpressionNode('MATCH', ['f4'], [4]);

                it(' to OR nested in an AND', function() {
                    var result = parser.AND(one,
                        parser.OR(two, three)
                    ).toString();

                    expect(result).toBe('MATCH{1}:f1 AND (MATCH{2}:f2 OR MATCH{3}:f3)')
                });

                it(' to XOR nested in an AND', function() {
                    var result = parser.AND(one,
                        parser.XOR(two, three)
                    ).toString();

                    expect(result).toBe('MATCH{1}:f1 AND (MATCH{2}:f2 XOR MATCH{3}:f3)')
                });

                it(' to XOR nested in a BEFORE', function() {
                    var result = parser.BEFORE(one,
                        parser.XOR(two, three)
                    ).toString();

                    expect(result).toBe('MATCH{1}:f1 BEFORE (MATCH{2}:f2 XOR MATCH{3}:f3)')
                });

                it(' to OR nested in a NOT', function() {
                    var result = parser.OR(one, two).NOT().toString();

                    expect(result).toBe('NOT (MATCH{1}:f1 OR MATCH{2}:f2)')
                });

                it(' to inner ORs within an AND', function() {
                    var result = parser.AND(
                        one.OR(two),
                        three.OR(four)
                    ).toString();

                    expect(result).toBe('(MATCH{1}:f1 OR MATCH{2}:f2) AND (MATCH{3}:f3 OR MATCH{4}:f4)')
                });

                it(' to only the first inner OR within an AND', function() {
                    var result = parser.AND(
                        one.OR(two).OR(three),
                        four
                    ).toString();

                    expect(result).toBe('(MATCH{1}:f1 OR MATCH{2}:f2 OR MATCH{3}:f3) AND MATCH{4}:f4')
                });

                it(' but not to AND nested in an OR', function() {
                    var result = parser.OR(one,
                        parser.AND(two, three)
                    ).toString();

                    expect(result).toBe('MATCH{1}:f1 OR MATCH{2}:f2 AND MATCH{3}:f3')
                });

                it(' but not to a NOT nested in an OR', function() {
                    var result = parser.OR(one.NOT(), two).toString();

                    expect(result).toBe('NOT MATCH{1}:f1 OR MATCH{2}:f2')
                });
            });
        });
    });
});
