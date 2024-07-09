import Knex from "knex";

const knex = Knex({
    client: "sqlite3",
    connection: {
        filename: 'db/mydb.sqlite'
    }
})

const tableExists = async (table: string) => {
    return await knex.schema.hasTable(table)
}

export const verifyAndCreateTables = async () => {
    if (!(await tableExists('assignment'))) {
        await knex.schema.createTable('assignment', table => {
            table.string('id').primary();
            table.string('assistant_id');
            table.string('thread_id');
        })
    }

    if (!(await tableExists('assistant'))) {
        await knex.schema.createTable('assistant', table => {
            table.string('id').primary();
            table.integer('created_at');
            table.string('name', 128);
            table.string('instructions', 512);
            table.string('model', 20);
            table.integer('author', 20);
        })
    }
}