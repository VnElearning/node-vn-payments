import { VNPay, TEST_CONFIG } from '../src/vnpay';

describe('VNPay', () => {
	let vnpay;

	beforeEach(() => {
		vnpay = new VNPay({
			paymentGateway: TEST_CONFIG.paymentGateway,
			merchant: TEST_CONFIG.merchant,
			secureSecret: TEST_CONFIG.secureSecret,
		});
	});

	describe('VNPay.buildCheckoutUrl', () => {
		it('should return correct payment request URL for some details', () => {
			// we'll use this demo URL from VNPay developer website for authenticity
			// http://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=50000000&vnp_Command=pay&vnp_CreateDate=20180112172309&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+giay+adidas&vnp_OrderType=fashion&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A8080%2Fpayment%2Fcallback&vnp_TmnCode=COCOSIN&vnp_TxnRef=node-2018-01-12T10%3A23%3A09.796Z&vnp_Version=2&vnp_SecureHashType=MD5&vnp_SecureHash=f900c20174d35ef1f9a1368fe420fecd
			const checkoutPayload = {
				createdDate: '20180112172309',
				amount: 500000,
				clientIp: '127.0.0.1',
				locale: 'vn',
				currency: 'VND',
				orderId: 'node-2018-01-12T10:23:09.796Z',
				orderInfo: 'Thanh toan giay adidas',
				orderType: 'fashion',
				returnUrl: 'http://localhost:8080/payment/callback',
				transactionId: 'node-2018-01-12T10:23:09.796Z',
				customerId: 'thanhvt',
				bankCode: null,
			};

			const redirectUrl = vnpay.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vnp_SecureHash')).toEqual('f900c20174d35ef1f9a1368fe420fecd');
		});

		it('should throw errors at missing required details', () => {
			const checkoutPayload = {};
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Amount is required');

			checkoutPayload.amount = 100;
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Client ip is required');

			checkoutPayload.clientIp = '127.0.0.1';
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Order ID is required');

			checkoutPayload.orderId = 'TEST123';
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Order info is required');

			checkoutPayload.orderInfo = 'test';
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Order type is required');

			checkoutPayload.orderType = 'fashion';
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Return url is required');

			checkoutPayload.returnUrl = 'http://localhost:8080/payment/callback';
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Transaction ID is required');

			checkoutPayload.transactionId = 'TEST123';
			expect(() => {
				vnpay.buildCheckoutUrl(checkoutPayload);
			}).not.toThrow();
		});

		describe('validate wrong inputs', () => {
			let checkoutPayload;

			beforeEach(() => {
				checkoutPayload = {
					amount: 100,
					clientIp: '127.0.0.1',
					orderId: 'TEST123',
					orderInfo: 'test',
					orderType: 'fashion',
					returnUrl: 'http://localhost:8080/payment/callback',
					transactionId: 'TEST123',
				};
			});

			it('should throw errors at wrong amount input', () => {
				checkoutPayload.amount = '100';

				expect(() => {
					vnpay.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Amount must be of type Integer');

				checkoutPayload.amount = 123.45;
				expect(() => {
					vnpay.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Amount must be an integer');

				checkoutPayload.amount = 99999999999; // more than max
				expect(() => {
					vnpay.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Amount cannot exceed 9999999999');
			});

			it('should throw errors at wrong email input', () => {
				checkoutPayload.customerEmail = '';

				expect(() => {
					vnpay.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Customer email must be a valid email address');

				checkoutPayload.customerEmail = 'invalid.email';

				expect(() => {
					vnpay.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Customer email must be a valid email address');

				checkoutPayload.customerEmail = 'valid@email.xyz';

				expect(() => {
					vnpay.buildCheckoutUrl(checkoutPayload);
				}).not.toThrow();
			});
		});
	});

	describe('VNPayDom.verifyReturnUrl', () => {
		it('should verify the return URL', () => {
			const correctReturnUrl = {
				vnp_Amount: '90000000',
				vnp_BankCode: 'NCB',
				vnp_BankTranNo: '20180115170515',
				vnp_CardType: 'ATM',
				vnp_OrderInfo: 'Thanh toan giay adidas',
				vnp_PayDate: '20180115170716',
				vnp_ResponseCode: '00',
				vnp_TmnCode: 'COCOSIN',
				vnp_TransactionNo: '13008888',
				vnp_TxnRef: 'node-2018-01-15T10:04:36.540Z',
				vnp_SecureHashType: 'MD5',
				vnp_SecureHash: '115ad37de7ae4d28eb819ca3d3d85b20',
			};

			expect(vnpay.verifyReturnUrl(correctReturnUrl)).toEqual({
				merchant: 'COCOSIN',
				transactionId: 'node-2018-01-15T10:04:36.540Z',
				amount: 900000,
				orderInfo: 'Thanh toan giay adidas',
				responseCode: '00',
				bankCode: 'NCB',
				bankTranNo: '20180115170515',
				cardType: 'ATM',
				payDate: '20180115170716',
				gatewayTransactionNo: '13008888',
				secureHash: '115ad37de7ae4d28eb819ca3d3d85b20',
				message: 'Giao dịch thành công',
				isSuccess: true,
				vnp_Amount: '90000000',
				vnp_BankCode: 'NCB',
				vnp_BankTranNo: '20180115170515',
				vnp_CardType: 'ATM',
				vnp_OrderInfo: 'Thanh toan giay adidas',
				vnp_PayDate: '20180115170716',
				vnp_ResponseCode: '00',
				vnp_TmnCode: 'COCOSIN',
				vnp_TransactionNo: '13008888',
				vnp_TxnRef: 'node-2018-01-15T10:04:36.540Z',
				vnp_SecureHashType: 'MD5',
				vnp_SecureHash: '115ad37de7ae4d28eb819ca3d3d85b20',
			});

			const incorrectReturnUrl = Object.assign({}, correctReturnUrl, { vnp_Amount: '50000000' });
			let errorResults = vnpay.verifyReturnUrl(incorrectReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);
			expect(errorResults.message).toEqual('Wrong checksum');

			const userCancelReturnUrl = {
				vnp_Amount: '90000000',
				vnp_BankCode: 'VNPAY',
				vnp_CardType: 'ATM',
				vnp_OrderInfo: 'Thanh toan giay adidas',
				vnp_PayDate: '20180115172917',
				vnp_ResponseCode: '24',
				vnp_TmnCode: 'COCOSIN',
				vnp_TransactionNo: '0',
				vnp_TxnRef: 'node-2018-01-15T10:29:07.696Z',
				vnp_SecureHashType: 'MD5',
				vnp_SecureHash: '305d85b6eb840c29cd5707932ab0ac8b',
			};

			errorResults = vnpay.verifyReturnUrl(userCancelReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);
			expect(errorResults.message).toEqual('Giao dịch không thành công do: Khách hàng hủy giao dịch');
		});
	});
});
