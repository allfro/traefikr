import { createToken, Lexer, CstParser, IToken } from 'chevrotain'

// Define tokens
const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z]\w*/ })
const LParen = createToken({ name: 'LParen', pattern: /\(/ })
const RParen = createToken({ name: 'RParen', pattern: /\)/ })
const Backtick = createToken({ name: 'Backtick', pattern: /`/ })
const BacktickString = createToken({
  name: 'BacktickString',
  pattern: /`[^`]*`/,
  line_breaks: false
})
const Comma = createToken({ name: 'Comma', pattern: /,/ })
const AndOp = createToken({ name: 'AndOp', pattern: /&&/ })
const OrOp = createToken({ name: 'OrOp', pattern: /\|\|/ })
const NotOp = createToken({ name: 'NotOp', pattern: /!/ })
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

// Order matters! More specific tokens must come first
const allTokens = [
  WhiteSpace,
  AndOp,
  OrOp,
  NotOp,
  LParen,
  RParen,
  Comma,
  BacktickString,
  Identifier
]

const RuleLexer = new Lexer(allTokens)

// AST node types
export interface RuleCondition {
  id: string
  type: string
  value: string
  value2?: string
  negate: boolean
}

export interface RuleGroup {
  id: string
  operator: 'AND' | 'OR'
  conditions: RuleCondition[]
}

export interface ParsedRule {
  groups: RuleGroup[]
  groupOperator: 'AND' | 'OR'
}

class TraefikRuleParser extends CstParser {
  constructor() {
    super(allTokens)
    this.performSelfAnalysis()
  }

  // Main entry point: rule = expression
  public rule = this.RULE('rule', () => {
    this.SUBRULE(this.orExpression)
  })

  // OR has lower precedence than AND
  private orExpression = this.RULE('orExpression', () => {
    this.SUBRULE(this.andExpression, { LABEL: 'lhs' })
    this.MANY(() => {
      this.CONSUME(OrOp)
      this.SUBRULE2(this.andExpression, { LABEL: 'rhs' })
    })
  })

  // AND has higher precedence than OR
  private andExpression = this.RULE('andExpression', () => {
    this.SUBRULE(this.atomicExpression, { LABEL: 'lhs' })
    this.MANY(() => {
      this.CONSUME(AndOp)
      this.SUBRULE2(this.atomicExpression, { LABEL: 'rhs' })
    })
  })

  // Atomic expressions: function calls, negation, or parenthesized expressions
  private atomicExpression = this.RULE('atomicExpression', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.parenthesizedExpression) },
      { ALT: () => this.SUBRULE(this.negatedExpression) },
      { ALT: () => this.SUBRULE(this.functionCall) }
    ])
  })

  // Parenthesized expression: ( expression )
  private parenthesizedExpression = this.RULE('parenthesizedExpression', () => {
    this.CONSUME(LParen)
    this.SUBRULE(this.orExpression)
    this.CONSUME(RParen)
  })

  // Negated expression: !expression
  private negatedExpression = this.RULE('negatedExpression', () => {
    this.CONSUME(NotOp)
    this.SUBRULE(this.atomicExpression)
  })

  // Function call: Identifier(args)
  private functionCall = this.RULE('functionCall', () => {
    this.CONSUME(Identifier)
    this.CONSUME(LParen)
    this.OPTION(() => {
      this.SUBRULE(this.argumentList)
    })
    this.CONSUME(RParen)
  })

  // Argument list: arg, arg, arg
  private argumentList = this.RULE('argumentList', () => {
    this.CONSUME(BacktickString, { LABEL: 'arg' })
    this.MANY(() => {
      this.CONSUME(Comma)
      this.CONSUME2(BacktickString, { LABEL: 'arg' })
    })
  })
}

// Create singleton parser instance
const parserInstance = new TraefikRuleParser()

// Visitor to convert CST to AST
class RuleVisitor extends parserInstance.getBaseCstVisitorConstructor() {
  constructor() {
    super()
    this.validateVisitor()
  }

  rule(ctx: any): { type: string; operator?: string; left?: any; right?: any; children?: any[] } {
    return this.visit(ctx.orExpression)
  }

  orExpression(ctx: any): any {
    let result = this.visit(ctx.lhs)

    if (ctx.rhs && ctx.rhs.length > 0) {
      const children = [result, ...ctx.rhs.map((rhs: any) => this.visit(rhs))]
      return {
        type: 'or',
        operator: '||',
        children
      }
    }

    return result
  }

  andExpression(ctx: any): any {
    let result = this.visit(ctx.lhs)

    if (ctx.rhs && ctx.rhs.length > 0) {
      const children = [result, ...ctx.rhs.map((rhs: any) => this.visit(rhs))]
      return {
        type: 'and',
        operator: '&&',
        children
      }
    }

    return result
  }

  atomicExpression(ctx: any): any {
    if (ctx.parenthesizedExpression) {
      return this.visit(ctx.parenthesizedExpression)
    }
    if (ctx.negatedExpression) {
      return this.visit(ctx.negatedExpression)
    }
    if (ctx.functionCall) {
      return this.visit(ctx.functionCall)
    }
  }

  parenthesizedExpression(ctx: any): any {
    return this.visit(ctx.orExpression)
  }

  negatedExpression(ctx: any): any {
    const child = this.visit(ctx.atomicExpression)
    return {
      type: 'not',
      negate: true,
      child
    }
  }

  functionCall(ctx: any): any {
    const funcName = ctx.Identifier[0].image
    const args: string[] = []

    if (ctx.argumentList) {
      const argList = this.visit(ctx.argumentList)
      args.push(...argList)
    }

    return {
      type: 'function',
      name: funcName,
      args
    }
  }

  argumentList(ctx: any): string[] {
    return ctx.arg.map((token: IToken) => {
      // Remove backticks from the argument
      return token.image.slice(1, -1)
    })
  }
}

const visitor = new RuleVisitor()

// Protocol-specific valid matchers (from Traefik documentation)
type Protocol = 'http' | 'tcp' | 'udp'

const VALID_MATCHERS: Record<Protocol, Set<string>> = {
  http: new Set([
    'Header', 'HeaderRegexp',
    'Host', 'HostRegexp',
    'Method',
    'Path', 'PathPrefix', 'PathRegexp',
    'Query', 'QueryRegexp',
    'ClientIP'
  ]),
  tcp: new Set([
    'HostSNI', 'HostSNIRegexp',
    'ClientIP',
    'ALPN'
  ]),
  udp: new Set([]) // UDP has no routing rules
}

// Validate that all function names in the AST are valid for the protocol
function validateProtocol(ast: any, protocol: Protocol): boolean {
  const validMatchers = VALID_MATCHERS[protocol]

  // UDP has no rules
  if (protocol === 'udp') {
    console.error('UDP protocol does not support routing rules')
    return false
  }

  function validate(node: any): boolean {
    if (node.type === 'function') {
      if (!validMatchers.has(node.name)) {
        console.error(`Invalid matcher '${node.name}' for ${protocol.toUpperCase()} protocol. Valid matchers: ${Array.from(validMatchers).join(', ')}`)
        return false
      }
      return true
    } else if (node.type === 'not') {
      return validate(node.child)
    } else if (node.type === 'and' || node.type === 'or') {
      return node.children.every((child: any) => validate(child))
    }
    return true
  }

  return validate(ast)
}

// Determine the inner operator of a node (for a group's operator)
function getInnerOperator(node: any): 'AND' | 'OR' {
  if (node.type === 'and') return 'AND'
  if (node.type === 'or') return 'OR'
  return 'OR' // Default for single conditions
}

// Convert AST to RuleGroup structure
function astToGroups(ast: any, groupIdCounter: { value: number }): ParsedRule {
  // Handle top-level OR operator (groups joined by OR)
  if (ast.type === 'or' && ast.children) {
    const groups: RuleGroup[] = []

    for (const child of ast.children) {
      // Each child of top-level OR is a group
      const groupConditions = extractConditions(child, [])
      if (groupConditions.length > 0) {
        groups.push({
          id: (++groupIdCounter.value).toString(),
          operator: getInnerOperator(child),
          conditions: groupConditions
        })
      }
    }

    return { groups, groupOperator: 'OR' }
  }

  // Handle top-level AND operator (groups joined by AND)
  if (ast.type === 'and' && ast.children) {
    const groups: RuleGroup[] = []

    for (const child of ast.children) {
      const groupConditions = extractConditions(child, [])
      if (groupConditions.length > 0) {
        groups.push({
          id: (++groupIdCounter.value).toString(),
          operator: getInnerOperator(child),
          conditions: groupConditions
        })
      }
    }

    return { groups, groupOperator: 'AND' }
  }

  // Single condition or group
  const conditions = extractConditions(ast, [])
  return {
    groups: [{
      id: '1',
      operator: 'OR',
      conditions
    }],
    groupOperator: 'AND'
  }
}

function extractConditions(node: any, conditions: RuleCondition[], negate = false): RuleCondition[] {
  if (node.type === 'function') {
    const condition: RuleCondition = {
      id: Date.now().toString() + Math.random(),
      type: node.name,
      value: node.args[0] || '',
      negate
    }

    // For Header/Query types with two args, first is key (value2), second is value
    if (node.args.length > 1 && ['Header', 'HeaderRegexp', 'Query', 'QueryRegexp'].includes(node.name)) {
      condition.value2 = node.args[0]
      condition.value = node.args[1]
    }

    // For Method with multiple args, join with comma
    if (node.name === 'Method' && node.args.length > 1) {
      condition.value = node.args.join(', ')
    }

    conditions.push(condition)
  } else if (node.type === 'not') {
    extractConditions(node.child, conditions, !negate)
  } else if (node.type === 'and' || node.type === 'or') {
    // For AND/OR nodes within a group, extract all conditions
    for (const child of node.children || []) {
      extractConditions(child, conditions, negate)
    }
  }

  return conditions
}

// Main parse function
export function parseTraefikRule(rule: string, protocol: Protocol = 'http'): ParsedRule | null {
  if (!rule || !rule.trim()) {
    return null
  }

  try {
    // Tokenize
    const lexResult = RuleLexer.tokenize(rule)

    if (lexResult.errors.length > 0) {
      console.error('Lexer errors:', lexResult.errors)
      return null
    }

    // Parse
    parserInstance.input = lexResult.tokens
    const cst = parserInstance.rule()

    if (parserInstance.errors.length > 0) {
      console.error('Parser errors:', parserInstance.errors)
      return null
    }

    // Convert CST to AST
    const ast = visitor.visit(cst)

    // Validate protocol-specific matchers
    if (!validateProtocol(ast, protocol)) {
      return null
    }

    // Convert AST to RuleGroup structure
    const groupIdCounter = { value: 0 }
    const result = astToGroups(ast, groupIdCounter)

    return result
  } catch (error) {
    console.error('Failed to parse rule:', error)
    return null
  }
}