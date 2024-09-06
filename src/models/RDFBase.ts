export class RDFBase {
    private subject: Subject;
    private properties: Map<string, string[]>;
    private toSemantize: Map<string, RDFBase[]> = new Map<string, RDFBase[]>();

    protected addToSemantize(rdf: RDFBase, context?: Resource): void {
        const id = context ? context.toString() : "default";
        if (!this.toSemantize.has(id)) this.toSemantize.set(id, []);
        this.toSemantize.get(id)?.push(rdf);
    }

    public get resource(): Resource {
        return this.subject as Resource;
    }

    constructor(subject: Subject, context?: Resource) {
        this.subject = subject;
        this.properties = new Map<string, string[]>();
        this.addToSemantize(this, context);
    }

    public addProperty(predicate: Predicate, object: Object): Triple {
        const predicateString = predicate.toString();
        if (!this.properties.has(predicateString))
            this.properties.set(predicateString, []);

        const objectString = object.toString();
        if (!this.properties.get(predicateString)?.includes(objectString))
            this.properties.get(predicateString)?.push(objectString);

        return new Triple(
            this.subject as Resource,
            predicate as Resource,
            object as Resource
        );
    }

    public toString(): string {
        return `${this.subject} ${Array.from(this.properties.entries())
            .map(([predicate, objects]) => {
                return (
                    predicate +
                    " " +
                    objects.map((object) => object.toString()).join(" ,\n\t\t")
                );
            })
            .join(" ;\n\t")} .`;
    }

    public generateSemantizeString(rdfBase: RDFBase): string {
        let toSemantize: string = "";
        for (const context of rdfBase.toSemantize.keys()) {
            if (context !== "default") toSemantize += `graph ${context} {\n`;

            for (const rdf of rdfBase.toSemantize.get(context) as RDFBase[]) {
                if (rdf !== rdfBase) {
                    toSemantize += rdf.generateSemantizeString(rdf);
                } else {
                    toSemantize += `${rdf.toString()}\n`;
                }
            }

            if (context !== "default") toSemantize += `}\n`;
        }
        return toSemantize;
    }

    public async semantize(description: string): Promise<void> {
        const toSemantize = this.generateSemantizeString(this);

        const updateQuery =
            process.env.ONTOLOGY_HEADER + `\n\nINSERT DATA {\n${toSemantize}}`;
        try {
            const endpointUrl = `${process.env.ONTOLOGY_URL}`;
            // execute query to blazegraph
            const result = await fetch(endpointUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ update: updateQuery }),
            });

            /*if (!result.ok) 
                throw new Error(`HTTP error! status: ${result.status}`);*/

            console.log(result.status, description);
        } catch (error) {
            console.error(error, description, updateQuery);
        }
    }
}

export class Triple {
    private subject: Resource;
    private predicate: Resource;
    private object: Resource;

    constructor(subject: Resource, predicate: Resource, object: Resource) {
        this.subject = subject;
        this.predicate = predicate;
        this.object = object;
    }

    public toString(): string {
        return `<<${this.subject} ${this.predicate} ${this.object}>>`;
    }
}

export class Resource {
    private id: string;

    constructor(id: string) {
        this.id = id;
    }

    public toString(): string {
        return process.env.ONTOLOGY_PREFIX + this.id;
    }
}

export type DataType = "string" | "integer" | "boolean" | "dateTime";

export class XSDData {
    private value: string;
    private type: DataType;

    constructor(value: string | number | boolean, type: DataType) {
        this.value = this.escapeQuotes(value.toString());
        this.type = type;
    }

    private escapeQuotes(value: string): string {
        return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    toString(): string {
        return `"${this.value}"^^xsd:${this.type}`;
    }
}

export type Subject = Resource | Triple;
export type Predicate = Resource | string;
export type Object = Resource | XSDData;
