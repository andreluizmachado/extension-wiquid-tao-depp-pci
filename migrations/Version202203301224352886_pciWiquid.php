<?php

declare(strict_types=1);

namespace oat\pciWiquid\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\qtiItemPci\model\PciModel;
use oat\pciWiquid\scripts\install\RegisterPciDelor;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202203301224352886_pciWiquid extends AbstractMigration
{

    public function getDescription(): string
    {
        return 'Restore the previous version of the Delor interaction';
    }

    public function up(Schema $schema): void
    {
        $registry = (new PciModel())->getRegistry();
        if ($registry->has('delor')) {
            /** @noinspection PhpUnhandledExceptionInspection */
            $registry->removeAllVersions('delor');
        }

    }

    public function down(Schema $schema): void
    {
        throw new IrreversibleMigration(
            'In order to undo this migration, please revert the client-side changes and run ' . RegisterPciMathEntry::class
        );

    }
}
