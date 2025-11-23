import {AuthenticationBindings} from '@loopback/authentication';
import {
  Getter,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
  globalInterceptor,
  inject,
} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {intersection} from 'lodash';
import {CurrentUser} from '../types';

@globalInterceptor('', {tags: {name: 'authorize'}})
export class AuthorizeInterceptor implements Provider<Interceptor> {
  constructor(
    @inject(AuthenticationBindings.METADATA)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public metaData: any,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    public getCurrentUser: Getter<CurrentUser>,
  ) { }

  value(): Interceptor {
    return this.intercept.bind(this);
  }

  async intercept(
    context: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<InvocationResult> {
    // No authorization metadata → allow access
    if (!this.metaData?.[0]?.options) {
      return next();
    }

    const {roles: requiredRoles = [], permissions: requiredPermissions = []} =
      this.metaData[0].options;

    // If neither roles nor permissions required → allow access
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return next();
    }

    const currentUser = await this.getCurrentUser();

    // SUPERADMIN BYPASS — (role based)
    if (currentUser.roles.includes('superadmin')) {
      return next();
    }

    // ROLE CHECK
    if (requiredRoles.length > 0) {
      const matchingRoles = intersection(currentUser.roles, requiredRoles);
      if (matchingRoles.length === 0) {
        throw new HttpErrors.Forbidden('ACCESS DENIED (Role required)');
      }
    }

    // PERMISSION CHECK
    if (requiredPermissions.length > 0) {
      const matchingPermissions = intersection(
        currentUser.permissions,
        requiredPermissions,
      );

      if (matchingPermissions.length === 0) {
        throw new HttpErrors.Forbidden(
          'ACCESS DENIED (Permission required)',
        );
      }
    }

    // Everything passed → continue
    return next();
  }
}
