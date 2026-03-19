-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_rentalAgreementId_fkey";

-- DropForeignKey
ALTER TABLE "RentInvoice" DROP CONSTRAINT "RentInvoice_rentalAgreementId_fkey";

-- DropForeignKey
ALTER TABLE "RentalAgreement" DROP CONSTRAINT "RentalAgreement_renterId_fkey";

-- AddForeignKey
ALTER TABLE "RentalAgreement" ADD CONSTRAINT "RentalAgreement_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "Renter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentInvoice" ADD CONSTRAINT "RentInvoice_rentalAgreementId_fkey" FOREIGN KEY ("rentalAgreementId") REFERENCES "RentalAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalAgreementId_fkey" FOREIGN KEY ("rentalAgreementId") REFERENCES "RentalAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
