import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {Filter, IsolationLevel, repository} from '@loopback/repository';
import {get, HttpErrors, param, patch, post, requestBody} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {authorize} from '../authorization';
import {BondEstimations} from '../models';
import {BondEstimationsRepository, CompanyProfilesRepository} from '../repositories';
import {MediaService} from '../services/media.service';

export class BondEstimationsController {
  constructor(
    @repository(BondEstimationsRepository)
    private bondEstimationsRepository: BondEstimationsRepository,
    @repository(CompanyProfilesRepository)
    private companyProfilesRepository: CompanyProfilesRepository,
    @inject('service.media.service')
    private mediaService: MediaService
  ) { }

  // fetch previous bond estimations...
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @get('/bond-estimations')
  async fetchAllBondEstimations(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.filter(BondEstimations) filter?: Filter<BondEstimations>,
  ): Promise<{success: boolean; message: string; estimations: {data: BondEstimations[], count: number}}> {
    const companyProfile = await this.companyProfilesRepository.findOne({
      where: {
        and: [
          {usersId: currentUser.id},
          {isActive: true},
          {isDeleted: false}
        ]
      }
    });

    if (!companyProfile || !companyProfile.id) {
      throw new HttpErrors.NotFound('No company found');
    }

    const bondEstimations = await this.bondEstimationsRepository.find({
      ...filter,
      limit: filter?.limit ?? 10,
      skip: filter?.skip ?? 0,
      where: {
        ...filter?.where,
        isDeleted: false,
        companyProfilesId: companyProfile.id
      }
    });

    const totalCount = await this.bondEstimationsRepository.count({...filter, isDeleted: false, companyProfilesId: companyProfile.id});

    return {
      success: true,
      message: 'Bond Estimations data',
      estimations: {
        data: bondEstimations,
        count: totalCount.count
      }
    }
  }

  // fetch data with application id
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @get('/bond-estimations/{applicationId}')
  async fetchBondEstimationData(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.path.string('applicationId') applicationId: string
  ): Promise<{success: boolean; message: string; estimation: BondEstimations}> {
    const companyProfile = await this.companyProfilesRepository.findOne({
      where: {
        and: [
          {usersId: currentUser.id},
          {isActive: true},
          {isDeleted: false}
        ]
      }
    });

    const estimation = await this.bondEstimationsRepository.findOne({
      where: {
        and: [
          {id: applicationId},
          {isActive: true},
          {isDeleted: false}
        ]
      },
      include: [
        {
          relation: 'estimationCreditRatings',
          scope: {
            include: [
              {relation: 'creditRatings'},
              {relation: 'creditRatingAgencies'},
              {
                relation: 'ratingLetter',
                scope: {
                  fields: {
                    id: true,
                    fileUrl: true,
                    fileOriginalName: true
                  }
                }
              }
            ]
          }
        },
        {relation: 'estimationBorrowingDetails'},
      ]
    });

    if (!estimation) {
      throw new HttpErrors.NotFound('No bond estimation application found');
    }

    if (!companyProfile || !companyProfile.id) {
      throw new HttpErrors.NotFound('No company found');
    }

    if (estimation.companyProfilesId !== companyProfile.id) {
      throw new HttpErrors.Unauthorized('Unauthorize Access');
    }

    return {
      success: true,
      message: 'Bond Estimation Data',
      estimation: estimation
    }
  }

  // intialize application...
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @post('/bond-estimations/initialize')
  async initializeBondEstimationApplication(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile
  ): Promise<{success: boolean; message: string; application: BondEstimations}> {
    const companyProfile = await this.companyProfilesRepository.findOne({
      where: {
        and: [
          {usersId: currentUser.id},
          {isActive: true},
          {isDeleted: false}
        ]
      }
    });

    if (companyProfile && companyProfile.id) {
      const newApplication = await this.bondEstimationsRepository.create({
        isActive: true,
        isDeleted: false,
        currentProgress: ['initialize'],
        companyProfilesId: companyProfile.id
      });

      return {
        success: true,
        message: 'New Bond estimation initialized',
        application: newApplication
      }
    }

    throw new HttpErrors.NotFound('Company not found');
  }

  // fund position
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @patch('/bond-estimations/fund-positions/{applicationId}')
  async updateBondEstimationFundPosition(
    @param.path.string('applicationId') applicationId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['cashBalance', 'cashBalanceDate', 'bankBalance', 'bankBalanceDate'],
            properties: {
              cashBalance: {type: 'string'},
              cashBalanceDate: {type: 'string'},
              bankBalance: {type: 'string'},
              bankBalanceDate: {type: 'string'},
            }
          }
        }
      }
    })
    fundPosition: {
      cashBalance: string;
      cashBalanceDate: string;
      bankBalance: string;
      bankBalanceDate: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const bondEstimation = await this.bondEstimationsRepository.findById(applicationId);

    if (!bondEstimation) {
      throw new HttpErrors.NotFound('No bond estimation record found');
    }

    const newProgress = [
      ...bondEstimation.currentProgress,
    ];

    if (!newProgress.includes('fund_position')) {
      newProgress.push('fund_position');
    }

    await this.bondEstimationsRepository.updateById(applicationId, {fundPosition: fundPosition, currentProgress: newProgress});

    return {
      success: true,
      message: 'Fund position updated',
    }
  }

  // Credit ratings...
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @patch('/bond-estimations/credit-ratings/{applicationId}')
  async uploadCreditRatings(
    @param.path.string('applicationId') applicationId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['creditRatings'],
            properties: {
              creditRatings: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['validFrom', 'creditRatingsId', 'creditRatingAgenciesId', 'ratingLetterId', 'isActive'],
                  properties: {
                    validFrom: {type: 'string'},
                    creditRatingsId: {type: 'string'},
                    creditRatingAgenciesId: {type: 'string'},
                    ratingLetterId: {type: 'string'},
                    isActive: {type: 'boolean'}
                  }
                }
              }
            }
          }
        }
      }
    })
    body: {
      creditRatings: Array<{
        validFrom: string;
        creditRatingsId: string;
        creditRatingAgenciesId: string;
        ratingLetterId: string;
        isActive: boolean;
      }>
    }
  ): Promise<{success: boolean; message: string}> {
    const tx = await this.bondEstimationsRepository.dataSource.beginTransaction({IsolationLevel: IsolationLevel.READ_COMMITTED});
    try {
      const bondEstimation = await this.bondEstimationsRepository.findOne({
        where: {
          and: [
            {id: applicationId},
            {isActive: true},
            {isDeleted: false}
          ]
        },
        include: [{relation: 'estimationCreditRatings'}]
      }, {transaction: tx});

      if (!bondEstimation) {
        throw new HttpErrors.NotFound('Application not found');
      }

      const deletedMediaIds = bondEstimation.estimationCreditRatings?.map((rating) => rating?.ratingLetterId) || [];
      const newMediaIds = body.creditRatings?.map((rating) => rating.ratingLetterId);

      // deleting old one...
      await this.bondEstimationsRepository.estimationCreditRatings(applicationId).delete(undefined, {transaction: tx});

      // adding new ratings...
      for (const creditRating of body.creditRatings) {
        await this.bondEstimationsRepository.estimationCreditRatings(applicationId).create(creditRating, {transaction: tx});
      }

      const newProgress = [
        ...bondEstimation.currentProgress,
      ];

      if (!newProgress.includes('credit_ratings')) {
        newProgress.push('credit_ratings');
      }

      await this.bondEstimationsRepository.updateById(applicationId, {currentProgress: newProgress});
      await tx.commit();

      await this.mediaService.updateMediaUsedStatus(deletedMediaIds, false);
      await this.mediaService.updateMediaUsedStatus(newMediaIds, true);
      return {
        success: true,
        message: "Credit rating added"
      }
    } catch (error) {
      console.log('Error while creating bond estimation credtin rating agency :', error);
      await tx.rollback();
      throw error;
    }
  }

  // Borrowing details...
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @patch('/bond-estimations/borrowing-details/{applicationId}')
  async uploadBorrowingDetails(
    @param.path.string('applicationId') applicationId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['borrowingDetails'],
            properties: {
              borrowingDetails: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['lenderName', 'lenderAmount', 'repaymentTerms', 'borrowingType', 'interestPayment', 'monthlyPrincipal', 'monthlyInterest', 'isActive'],
                  properties: {
                    lenderName: {type: 'string'},
                    lenderAmount: {type: 'number'},
                    repaymentTerms: {type: 'number'},
                    borrowingType: {type: 'string'},
                    interestPayment: {type: 'number'},
                    monthlyPrincipal: {type: 'number'},
                    monthlyInterest: {type: 'number'},
                    isActive: {type: 'boolean'}
                  }
                }
              }
            }
          }
        }
      }
    })
    body: {
      borrowingDetails: Array<{
        lenderName: string;
        lenderAmount: number;
        repaymentTerms: number;
        borrowingType: string;
        interestPayment: number;
        monthlyPrincipal: number;
        monthlyInterest: number;
        isActive: boolean;
      }>
    }
  ): Promise<{success: boolean; message: string}> {
    const tx = await this.bondEstimationsRepository.dataSource.beginTransaction({IsolationLevel: IsolationLevel.READ_COMMITTED});
    try {
      const bondEstimation = await this.bondEstimationsRepository.findOne({
        where: {
          and: [
            {id: applicationId},
            {isActive: true},
            {isDeleted: false}
          ]
        },
        include: [{relation: 'estimationBorrowingDetails'}]
      }, {transaction: tx});

      if (!bondEstimation) {
        throw new HttpErrors.NotFound('Application not found');
      }

      // deleting old one...
      await this.bondEstimationsRepository.estimationBorrowingDetails(applicationId).delete(undefined, {transaction: tx});

      // adding new ratings...
      for (const borrowing of body.borrowingDetails) {
        await this.bondEstimationsRepository.estimationBorrowingDetails(applicationId).create(borrowing, {transaction: tx});
      }

      const newProgress = [
        ...bondEstimation.currentProgress,
      ];

      if (!newProgress.includes('borrowing_details')) {
        newProgress.push('borrowing_details');
      }

      await this.bondEstimationsRepository.updateById(applicationId, {currentProgress: newProgress});
      await tx.commit();
      return {
        success: true,
        message: "Borrowing details added"
      }
    } catch (error) {
      console.log('Error while creating bond estimation borrowing details :', error);
      await tx.rollback();
      throw error;
    }
  }

  // Capital Details
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @patch('/bond-estimations/capital-details/{applicationId}')
  async updateBondEstimationCapitalDetails(
    @param.path.string('applicationId') applicationId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['shareCapital', 'reserveSurplus', 'netWorth'],
            properties: {
              shareCapital: {type: 'number'},
              reserveSurplus: {type: 'number'},
              netWorth: {type: 'number'},
            }
          }
        }
      }
    })
    capitalDetails: {
      shareCapital: number;
      reserveSurplus: number;
      netWorth: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const bondEstimation = await this.bondEstimationsRepository.findById(applicationId);

    if (!bondEstimation) {
      throw new HttpErrors.NotFound('No bond estimation record found');
    }

    const newProgress = [
      ...bondEstimation.currentProgress,
    ];

    if (!newProgress.includes('capital_details')) {
      newProgress.push('capital_details');
    }

    await this.bondEstimationsRepository.updateById(applicationId, {capitalDetails: capitalDetails, currentProgress: newProgress});

    return {
      success: true,
      message: 'Capital details updated',
    }
  }

  // generate dummy ratios...
  async generateRatios(applicationId: string, progress: string[]) {

    const random = (min: number, max: number) =>
      Number((Math.random() * (max - min) + min).toFixed(2));

    const financialRatios = {
      debtEquityRatio: random(0.5, 3),              // between 0.5 to 3
      currentRatio: random(1, 3),                   // ideal 1-3
      netWorth: random(10, 100),                    // crores maybe?
      quickRatio: random(0.8, 2),                   // quick assets ratio
      returnOnEquity: random(5, 25),                // ROE %
      debtServiceCoverageRatio: random(1, 3),       // DSCR
      returnOnAsset: random(3, 15),                 // ROA %
    };

    const newProgress = progress;

    if (!newProgress.includes('financial_details')) {
      newProgress.push('financial_details');
    }

    await this.bondEstimationsRepository.updateById(applicationId, {
      financialRatios,
      currentProgress: newProgress
    });

    return financialRatios;
  }

  // Profitability Details
  @authenticate('jwt')
  @authorize({roles: ['company']})
  @patch('/bond-estimations/profitability-details/{applicationId}')
  async updateBondEstimationProfitabilityDetails(
    @param.path.string('applicationId') applicationId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['netProfit', 'EBIDTA'],
            properties: {
              netProfit: {type: 'number'},
              EBIDTA: {type: 'number'},
            }
          }
        }
      }
    })
    profitabilityDetails: {
      netProfit: number;
      EBIDTA: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const bondEstimation = await this.bondEstimationsRepository.findById(applicationId);

    if (!bondEstimation) {
      throw new HttpErrors.NotFound('No bond estimation record found');
    }

    const newProgress = [
      ...bondEstimation.currentProgress,
    ];

    if (!newProgress.includes('profitability_details')) {
      newProgress.push('profitability_details');
    }

    await this.bondEstimationsRepository.updateById(applicationId, {profitabilityDetails: profitabilityDetails, currentProgress: newProgress});

    await this.generateRatios(applicationId, newProgress);
    return {
      success: true,
      message: 'Profitability Details updated',
    }
  }
}
