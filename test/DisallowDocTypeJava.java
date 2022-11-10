// GOOD Example
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);

// BAD Example
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);

private static final PROPERTY = "http://apache.org/xml/features/disallow-doctype-decl";

factory.setFeature(PROPERTY, false);