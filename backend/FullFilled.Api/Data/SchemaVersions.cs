namespace FullFilled.Api.Data;

public static class SchemaVersions
{
    public const int CurrentGameSave = 2;
    // DatabaseMigrator.Migrations icindeki en yuksek surumle ayni kalmali (analitik ucu bunu rapor eder).
    public const int CurrentDatabase = 9;
}
