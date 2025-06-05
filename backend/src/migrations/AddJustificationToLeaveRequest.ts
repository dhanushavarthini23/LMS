import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddJustificationToLeaveRequest1703000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add justification column
    await queryRunner.addColumn(
      'leave_requests',
      new TableColumn({
        name: 'justification',
        type: 'text',
        isNullable: true,
      })
    );

    // Add isBackdated column
    await queryRunner.addColumn(
      'leave_requests',
      new TableColumn({
        name: 'isBackdated',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('leave_requests', 'justification');
    await queryRunner.dropColumn('leave_requests', 'isBackdated');
  }
}