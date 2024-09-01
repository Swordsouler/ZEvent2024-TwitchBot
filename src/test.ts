import "dotenv/config";
import { RDFBase, Resource, XSDData } from "./models/RDFBase";

const test: RDFBase = new RDFBase(new Resource("test"));
test.addProperty(
    new Resource("date"),
    new XSDData(new Date().toISOString(), "dateTime")
);
test.semantize("test has ben semantized");
