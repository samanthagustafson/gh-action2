// Bad code - using ObjectInputStream directly
public class BadRequestProcessor {
  protected void processRequest(HttpServletRequest request) {
    ServletInputStream sis = request.getInputStream();
    ObjectInputStream ois = new ObjectInputStream(sis);
    Object obj = ois.readObject(); // Noncompliant
  }
}

// Good Code - Extending ObjectInputStream and then using it.
public class SecureObjectInputStream extends ObjectInputStream {
  // Constructor here

  @Override
  protected Class<?> resolveClass(ObjectStreamClass osc) throws IOException, ClassNotFoundException {
    // Only deserialize instances of AllowedClass
    if (!osc.getName().equals(AllowedClass.class.getName())) {
      throw new InvalidClassException("Unauthorized deserialization", osc.getName());
	    }
	    return super.resolveClass(osc);
	  }
}
public class GoodRequestProcessor {
  protected void processRequest(HttpServletRequest request) {
    ServletInputStream sis = request.getInputStream();
    SecureObjectInputStream sois = new SecureObjectInputStream(sis);
    Object obj = sois.readObject();
  }
}